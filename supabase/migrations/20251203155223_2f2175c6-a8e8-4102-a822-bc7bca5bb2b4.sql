-- Add 'Privatperson' to contact_type enum
ALTER TYPE contact_type ADD VALUE 'Privatperson';

-- Add preference columns to contacts table
ALTER TABLE public.contacts 
ADD COLUMN wants_sms boolean DEFAULT false,
ADD COLUMN wants_newsletter boolean DEFAULT false,
ADD COLUMN wants_personalized_offers boolean DEFAULT false;