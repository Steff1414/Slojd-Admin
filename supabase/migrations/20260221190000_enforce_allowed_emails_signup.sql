-- Enforce allowlist at database level for all new auth users.
-- This prevents bypassing frontend-only checks.

CREATE OR REPLACE FUNCTION public.normalize_allowed_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'E-postadress krävs';
  END IF;

  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_allowed_email_before_write ON public.allowed_emails;
CREATE TRIGGER normalize_allowed_email_before_write
  BEFORE INSERT OR UPDATE ON public.allowed_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_allowed_email();

CREATE OR REPLACE FUNCTION public.enforce_allowed_email_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR trim(NEW.email) = '' THEN
    RAISE EXCEPTION 'E-postadress krävs';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.allowed_emails ae
    WHERE ae.email = lower(trim(NEW.email))
  ) THEN
    RAISE EXCEPTION 'E-postadressen är inte godkänd';
  END IF;

  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_allowed_email_signup ON auth.users;
CREATE TRIGGER enforce_allowed_email_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_allowed_email_signup();
