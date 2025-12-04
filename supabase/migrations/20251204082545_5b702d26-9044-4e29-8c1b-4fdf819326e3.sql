-- Create enums for case management
CREATE TYPE case_status AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');
CREATE TYPE case_priority AS ENUM ('LOW', 'NORMAL', 'HIGH');
CREATE TYPE case_channel AS ENUM ('EMAIL', 'PHONE', 'CHAT', 'OTHER');
CREATE TYPE case_message_direction AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL_NOTE');
CREATE TYPE case_message_type AS ENUM ('EMAIL', 'PHONE_CALL', 'NOTE', 'OTHER');
CREATE TYPE shipment_status AS ENUM ('CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED');

-- Create cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id),
  customer_id UUID REFERENCES public.customers(id),
  order_id UUID REFERENCES public.orders(id),
  subject TEXT NOT NULL,
  description TEXT,
  status case_status NOT NULL DEFAULT 'OPEN',
  priority case_priority DEFAULT 'NORMAL',
  channel case_channel NOT NULL DEFAULT 'EMAIL',
  created_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create case_messages table
CREATE TABLE public.case_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  direction case_message_direction NOT NULL,
  message_type case_message_type NOT NULL DEFAULT 'EMAIL',
  email_message_id UUID REFERENCES public.email_messages(id),
  body TEXT NOT NULL,
  author_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  shipment_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  tracking_number TEXT,
  tracking_url TEXT,
  status shipment_status NOT NULL DEFAULT 'CREATED',
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- RLS policies for cases
CREATE POLICY "Authenticated users can view cases"
ON public.cases FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage cases"
ON public.cases FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for case_messages
CREATE POLICY "Authenticated users can view case_messages"
ON public.case_messages FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage case_messages"
ON public.case_messages FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS policies for shipments
CREATE POLICY "Authenticated users can view shipments"
ON public.shipments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage shipments"
ON public.shipments FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_cases_contact_id ON public.cases(contact_id);
CREATE INDEX idx_cases_customer_id ON public.cases(customer_id);
CREATE INDEX idx_cases_order_id ON public.cases(order_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_case_messages_case_id ON public.case_messages(case_id);
CREATE INDEX idx_shipments_order_id ON public.shipments(order_id);