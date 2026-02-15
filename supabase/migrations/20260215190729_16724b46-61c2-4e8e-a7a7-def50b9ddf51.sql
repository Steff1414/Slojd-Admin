
CREATE TABLE public.allowed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  added_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  note text
);

ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (needed for login check)
CREATE POLICY "Authenticated can read allowed_emails"
  ON public.allowed_emails FOR SELECT TO authenticated
  USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage allowed_emails"
  ON public.allowed_emails FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
