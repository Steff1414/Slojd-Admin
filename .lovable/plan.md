

## Restrict Login to Approved Emails Only

### Problem
Currently anyone with a Google account (or who signs up with email/password) can access the app. You want only pre-approved email addresses to be allowed in.

### Solution Overview
1. Create an `allowed_emails` table where admins add approved email addresses
2. After login/signup, check if the user's email exists in that table -- if not, sign them out and show an error
3. Add an admin page ("Godkanda anvandare") where admins can manage the allowed email list
4. Add navigation to this admin page (visible only to admins)

### How It Works
- An admin adds e.g. `anna@foretag.se` to the allowed list
- When Anna logs in (Google or email/password), the app checks the list
- If her email is found: she gets in
- If not: she's immediately signed out with a message "Din e-post ar inte godkand"

---

### Technical Details

#### 1. Database: `allowed_emails` table

```sql
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

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage allowed_emails"
  ON public.allowed_emails FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

Also seed the current logged-in user's email so the first admin doesn't lock themselves out.

#### 2. Auth gate: check allowed email after login

Modify `src/lib/auth.tsx`:
- After `onAuthStateChange` fires with a session, query `allowed_emails` for that email
- If not found: call `signOut()` and set an error state
- Pass an `accessDenied` flag to the context so the Auth page can display the rejection message

Modify `src/pages/Auth.tsx`:
- After successful signIn/signUp/Google login, check the `allowed_emails` table
- If the email is not in the list, sign out and show toast: "Din e-postadress ar inte godkand for inloggning. Kontakta en administrator."

#### 3. Admin UI: new page `src/pages/AllowedEmails.tsx`

- Table showing all allowed emails with date added and optional note
- Form to add a new email address
- Delete button to remove an email
- Only accessible to admin users (using `useUserRole` hook)

#### 4. Navigation

- Add "Godkanda e-poster" link in `AppLayout.tsx` navigation, conditionally shown only for admin users
- Add route in `App.tsx`

#### 5. Files to create/modify

| File | Action |
|------|--------|
| Migration SQL | Create `allowed_emails` table |
| `src/pages/AllowedEmails.tsx` | New admin page |
| `src/lib/auth.tsx` | Add email allowlist check |
| `src/pages/Auth.tsx` | Show rejection message |
| `src/components/layout/AppLayout.tsx` | Add admin nav link |
| `src/App.tsx` | Add route |

