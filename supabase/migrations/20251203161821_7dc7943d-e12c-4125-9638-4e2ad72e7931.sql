-- Phase 4: Communication, Email Templates & Web Activity Tracking

-- 1. Email Templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Email Messages (outbox) table
CREATE TYPE public.email_status AS ENUM ('QUEUED', 'SENT', 'FAILED');

CREATE TABLE public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.email_templates(id),
  type_key TEXT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status email_status DEFAULT 'QUEUED',
  related_order_id UUID REFERENCES public.orders(id),
  related_basket_id TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add web tracking consent to contacts
CREATE TYPE public.tracking_consent AS ENUM ('GRANTED', 'DENIED', 'UNKNOWN');

ALTER TABLE public.contacts
ADD COLUMN web_tracking_consent tracking_consent DEFAULT 'UNKNOWN',
ADD COLUMN consent_updated_at TIMESTAMPTZ;

-- 4. Web Sessions table
CREATE TABLE public.web_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_hash TEXT
);

-- 5. Web Events table
CREATE TYPE public.web_event_type AS ENUM ('PAGE_VIEW', 'PRODUCT_VIEW', 'CATEGORY_VIEW', 'ADD_TO_CART', 'CHECKOUT_START');

CREATE TABLE public.web_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.web_sessions(id) ON DELETE CASCADE,
  event_type web_event_type NOT NULL,
  url TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT,
  category_name TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  visit_index INTEGER
);

-- 6. Order Items table for category affinity
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category_name TEXT NOT NULL,
  main_category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Authenticated users can view email_templates"
ON public.email_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage email_templates"
ON public.email_templates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for email_messages
CREATE POLICY "Authenticated users can view email_messages"
ON public.email_messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage email_messages"
ON public.email_messages FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for web_sessions
CREATE POLICY "Authenticated users can view web_sessions"
ON public.web_sessions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage web_sessions"
ON public.web_sessions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for web_events
CREATE POLICY "Authenticated users can view web_events"
ON public.web_events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage web_events"
ON public.web_events FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLS Policies for order_items
CREATE POLICY "Authenticated users can view order_items"
ON public.order_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage order_items"
ON public.order_items FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update triggers for timestamp fields
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_messages_updated_at
BEFORE UPDATE ON public.email_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed email templates with Swedish copy
INSERT INTO public.email_templates (template_key, name, subject_template, body_template, description) VALUES
('WELCOME', 'Välkommen till oss', 'Välkommen {{firstName}}!', '<h1>Hej {{firstName}}!</h1><p>Välkommen till Slöjd-Detaljer. Vi är glada att ha dig som kund.</p><p>Utforska vårt sortiment av kreativa material för teckna & måla samt trä & metall.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>', 'Skickas till nya kunder'),
('ORDER_RECEIVED', 'Vi har tagit emot din order', 'Tack för din beställning #{{orderNumber}}', '<h1>Hej {{firstName}}!</h1><p>Vi har tagit emot din beställning <strong>#{{orderNumber}}</strong>.</p><p>Ordersumma: {{orderTotal}} kr</p><p>Vi behandlar din order och återkommer med leveransinformation.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>', 'Orderbekräftelse'),
('ORDER_CONFIRMED', 'Din order är bekräftad', 'Order #{{orderNumber}} är bekräftad', '<h1>Hej {{firstName}}!</h1><p>Din order <strong>#{{orderNumber}}</strong> är nu bekräftad och förbereds för leverans.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>', 'Skickas när ordern bekräftats'),
('ORDER_DELIVERED', 'Din order har levererats', 'Order #{{orderNumber}} har levererats', '<h1>Hej {{firstName}}!</h1><p>Vi har levererat din order <strong>#{{orderNumber}}</strong>.</p><p>Vi hoppas att du är nöjd med dina produkter!</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>', 'Skickas vid leverans'),
('PURCHASE_THANK_YOU', 'Tack för ditt köp', 'Tack för ditt köp hos Slöjd-Detaljer!', '<h1>Tack {{firstName}}!</h1><p>Vi uppskattar verkligen ditt köp. Dina produkter är på väg!</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>', 'Generellt tackmeddelande'),
('RECEIPT', 'Ditt kvitto', 'Kvitto för order #{{orderNumber}}', '<h1>Kvitto</h1><p>Hej {{firstName}},</p><p>Här är ditt kvitto för order <strong>#{{orderNumber}}</strong>.</p><p><strong>Summa:</strong> {{orderTotal}} kr</p><p>Tack för ditt köp!</p><p>Slöjd-Detaljer</p>', 'Kvitto för order'),
('ABANDONED_CART_REMINDER', 'Du har varor kvar i varukorgen', 'Glöm inte dina varor, {{firstName}}!', '<h1>Hej {{firstName}}!</h1><p>Vi såg att du har varor kvar i din varukorg.</p><p><a href="{{basketLink}}">Klicka här för att slutföra ditt köp</a></p><p>Behöver du hjälp? Kontakta oss gärna.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>', 'Påminnelse om övergiven varukorg');

-- Create index for performance
CREATE INDEX idx_email_messages_contact_id ON public.email_messages(contact_id);
CREATE INDEX idx_email_messages_sent_at ON public.email_messages(sent_at DESC);
CREATE INDEX idx_web_sessions_contact_id ON public.web_sessions(contact_id);
CREATE INDEX idx_web_sessions_started_at ON public.web_sessions(started_at DESC);
CREATE INDEX idx_web_events_session_id ON public.web_events(session_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_main_category ON public.order_items(main_category);