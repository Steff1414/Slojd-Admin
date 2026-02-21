-- Function to toggle admin role by email
-- Uses SECURITY DEFINER to access auth.users (not queryable from client)
CREATE OR REPLACE FUNCTION public.set_user_admin(target_email text, make_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Only admins can call this
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Look up user_id from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE auth.users.email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Användaren har inte loggat in ännu';
  END IF;

  -- Prevent removing own admin role
  IF NOT make_admin AND target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Du kan inte ta bort din egen adminroll';
  END IF;

  IF make_admin THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM user_roles
    WHERE user_id = target_user_id AND role = 'admin';
  END IF;
END;
$$;

-- Function to get which allowed emails have admin role
-- Returns emails joined with auth.users and user_roles
CREATE OR REPLACE FUNCTION public.get_admin_emails()
RETURNS TABLE (email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT au.email::text
  FROM user_roles ur
  JOIN auth.users au ON ur.user_id = au.id
  WHERE ur.role = 'admin';
END;
$$;
