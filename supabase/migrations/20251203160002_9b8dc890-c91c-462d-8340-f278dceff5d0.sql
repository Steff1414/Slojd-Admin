-- Add communication preferences to contact_customer_links (per role)
ALTER TABLE public.contact_customer_links
ADD COLUMN wants_sms boolean DEFAULT false,
ADD COLUMN wants_newsletter boolean DEFAULT false,
ADD COLUMN wants_personalized_offers boolean DEFAULT false;