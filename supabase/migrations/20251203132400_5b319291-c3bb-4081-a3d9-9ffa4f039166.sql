-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for RBAC
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  before_snapshot JSONB,
  after_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs (admins only)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create orders table for order simulation
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  buyer_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders
CREATE POLICY "Authenticated users can view orders" ON public.orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage orders" ON public.orders
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Add merged_into_id column to contacts for merge tracking
ALTER TABLE public.contacts ADD COLUMN merged_into_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Add must_change_password to profiles for temporary password flow
ALTER TABLE public.profiles ADD COLUMN must_change_password BOOLEAN DEFAULT false;

-- Seed orders with demo data
INSERT INTO public.orders (order_number, customer_id, total_amount, status, created_at)
SELECT 
  'ORD-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 6, '0'),
  id,
  (RANDOM() * 10000 + 500)::DECIMAL(10, 2),
  CASE WHEN RANDOM() > 0.1 THEN 'completed' ELSE 'pending' END,
  NOW() - (RANDOM() * INTERVAL '365 days')
FROM public.customers
LIMIT 20;

-- Assign admin role to first user (if exists)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users LIMIT 1
ON CONFLICT DO NOTHING;