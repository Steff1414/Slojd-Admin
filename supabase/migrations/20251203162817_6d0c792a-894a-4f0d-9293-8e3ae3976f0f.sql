-- Phase 4B & 4C: Addresses, Email Categories & Extensions

-- 1. Address type enum
CREATE TYPE public.address_type AS ENUM ('BILLING', 'DELIVERY', 'ALTERNATIVE_DELIVERY');

-- 2. Customer addresses table
CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  address_type address_type NOT NULL DEFAULT 'DELIVERY',
  label TEXT,
  name TEXT,
  street TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT,
  country TEXT NOT NULL DEFAULT 'Sverige',
  is_approved_delivery_address BOOLEAN DEFAULT false,
  is_default_for_type BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Email channel and category enums
CREATE TYPE public.email_channel AS ENUM ('EMAIL', 'SMS', 'NEWSLETTER', 'SYSTEM');
CREATE TYPE public.email_category AS ENUM (
  'WELCOME', 
  'ORDER_CONFIRMATION', 
  'ORDER_RECEIVED', 
  'ORDER_DELIVERED', 
  'PURCHASE_THANK_YOU', 
  'RECEIPT', 
  'ABANDONED_CART_REMINDER', 
  'NEWSLETTER', 
  'OTHER'
);

-- 4. Add channel and category to email_messages
ALTER TABLE public.email_messages
ADD COLUMN channel email_channel DEFAULT 'EMAIL',
ADD COLUMN category email_category DEFAULT 'OTHER';

-- 5. Add category to email_templates
ALTER TABLE public.email_templates
ADD COLUMN category email_category DEFAULT 'OTHER';

-- 6. Enable RLS on customer_addresses
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customer_addresses"
ON public.customer_addresses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage customer_addresses"
ON public.customer_addresses FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Update trigger for addresses
CREATE TRIGGER update_customer_addresses_updated_at
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Update existing email templates with categories
UPDATE public.email_templates SET category = 'WELCOME' WHERE template_key = 'WELCOME';
UPDATE public.email_templates SET category = 'ORDER_RECEIVED' WHERE template_key = 'ORDER_RECEIVED';
UPDATE public.email_templates SET category = 'ORDER_CONFIRMATION' WHERE template_key = 'ORDER_CONFIRMED';
UPDATE public.email_templates SET category = 'ORDER_DELIVERED' WHERE template_key = 'ORDER_DELIVERED';
UPDATE public.email_templates SET category = 'PURCHASE_THANK_YOU' WHERE template_key = 'PURCHASE_THANK_YOU';
UPDATE public.email_templates SET category = 'RECEIPT' WHERE template_key = 'RECEIPT';
UPDATE public.email_templates SET category = 'ABANDONED_CART_REMINDER' WHERE template_key = 'ABANDONED_CART_REMINDER';

-- 9. Indexes for performance
CREATE INDEX idx_customer_addresses_customer_id ON public.customer_addresses(customer_id);
CREATE INDEX idx_email_messages_category ON public.email_messages(category);
CREATE INDEX idx_email_messages_channel ON public.email_messages(channel);