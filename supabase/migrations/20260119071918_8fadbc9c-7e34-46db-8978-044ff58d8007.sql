-- =====================================================
-- FIX OVERLY PERMISSIVE RLS POLICIES
-- This migration implements role-based access control:
-- - All authenticated users can READ data (required for CRM operations)
-- - Only admins and moderators can WRITE data (INSERT/UPDATE/DELETE)
-- - Email templates require admin role for modifications (XSS risk)
-- =====================================================

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;

-- All authenticated users can read customers
CREATE POLICY "Authenticated users can view customers" 
ON customers FOR SELECT 
TO authenticated
USING (true);

-- Only admins and moderators can modify customers
CREATE POLICY "Admins and moderators can manage customers" 
ON customers FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================================================
-- CONTACTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON contacts;

CREATE POLICY "Authenticated users can view contacts" 
ON contacts FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and moderators can manage contacts" 
ON contacts FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================================================
-- ACCOUNTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage accounts" ON accounts;
DROP POLICY IF EXISTS "Authenticated users can view accounts" ON accounts;

CREATE POLICY "Authenticated users can view accounts" 
ON accounts FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and moderators can manage accounts" 
ON accounts FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================================================
-- AGREEMENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage agreements" ON agreements;
DROP POLICY IF EXISTS "Authenticated users can view agreements" ON agreements;

CREATE POLICY "Authenticated users can view agreements" 
ON agreements FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and moderators can manage agreements" 
ON agreements FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================================================
-- CONTACT_CUSTOMER_LINKS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage contact_customer_links" ON contact_customer_links;
DROP POLICY IF EXISTS "Authenticated users can view contact_customer_links" ON contact_customer_links;

CREATE POLICY "Authenticated users can view contact_customer_links" 
ON contact_customer_links FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and moderators can manage contact_customer_links" 
ON contact_customer_links FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================================================
-- TEACHER_SCHOOL_ASSIGNMENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage teacher_school_assignments" ON teacher_school_assignments;
DROP POLICY IF EXISTS "Authenticated users can view teacher_school_assignments" ON teacher_school_assignments;

CREATE POLICY "Authenticated users can view teacher_school_assignments" 
ON teacher_school_assignments FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and moderators can manage teacher_school_assignments" 
ON teacher_school_assignments FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================================================
-- CUSTOMER_ADDRESSES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage customer_addresses" ON customer_addresses;
DROP POLICY IF EXISTS "Authenticated users can view customer_addresses" ON customer_addresses;

CREATE POLICY "Authenticated users can view customer_addresses" 
ON customer_addresses FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and moderators can manage customer_addresses" 
ON customer_addresses FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================================================
-- EMAIL_TEMPLATES TABLE (Admin only for XSS protection)
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage email_templates" ON email_templates;
DROP POLICY IF EXISTS "Authenticated users can view email_templates" ON email_templates;

CREATE POLICY "Authenticated users can view email_templates" 
ON email_templates FOR SELECT 
TO authenticated
USING (true);

-- ONLY ADMINS can modify email templates (prevents XSS attacks)
CREATE POLICY "Admins can manage email_templates" 
ON email_templates FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- =====================================================
-- EMAIL_MESSAGES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage email_messages" ON email_messages;
DROP POLICY IF EXISTS "Authenticated users can view email_messages" ON email_messages;

CREATE POLICY "Authenticated users can view email_messages" 
ON email_messages FOR SELECT 
TO authenticated
USING (true);

-- All authenticated users can send emails (insert), but only admins can modify/delete
CREATE POLICY "Authenticated users can send email_messages" 
ON email_messages FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and moderators can modify email_messages" 
ON email_messages FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can delete email_messages" 
ON email_messages FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- ORDERS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON orders;

CREATE POLICY "Authenticated users can view orders" 
ON orders FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and moderators can manage orders" 
ON orders FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================================================
-- ORDER_ITEMS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage order_items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can view order_items" ON order_items;

CREATE POLICY "Authenticated users can view order_items" 
ON order_items FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and moderators can manage order_items" 
ON order_items FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================================================
-- CASES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage cases" ON cases;
DROP POLICY IF EXISTS "Authenticated users can view cases" ON cases;

CREATE POLICY "Authenticated users can view cases" 
ON cases FOR SELECT 
TO authenticated
USING (true);

-- All authenticated users can create cases (customer service needs this)
CREATE POLICY "Authenticated users can create cases" 
ON cases FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- All authenticated users can update cases (needed for status changes)
CREATE POLICY "Authenticated users can update cases" 
ON cases FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Only admins can delete cases
CREATE POLICY "Admins can delete cases" 
ON cases FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- CASE_MESSAGES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage case_messages" ON case_messages;
DROP POLICY IF EXISTS "Authenticated users can view case_messages" ON case_messages;

CREATE POLICY "Authenticated users can view case_messages" 
ON case_messages FOR SELECT 
TO authenticated
USING (true);

-- All authenticated users can create case messages
CREATE POLICY "Authenticated users can create case_messages" 
ON case_messages FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins and moderators can update/delete messages
CREATE POLICY "Admins and moderators can modify case_messages" 
ON case_messages FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can delete case_messages" 
ON case_messages FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- SHIPMENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage shipments" ON shipments;
DROP POLICY IF EXISTS "Authenticated users can view shipments" ON shipments;

CREATE POLICY "Authenticated users can view shipments" 
ON shipments FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and moderators can manage shipments" 
ON shipments FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================================================
-- WEB_SESSIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage web_sessions" ON web_sessions;
DROP POLICY IF EXISTS "Authenticated users can view web_sessions" ON web_sessions;

CREATE POLICY "Authenticated users can view web_sessions" 
ON web_sessions FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and moderators can manage web_sessions" 
ON web_sessions FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- =====================================================
-- WEB_EVENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage web_events" ON web_events;
DROP POLICY IF EXISTS "Authenticated users can view web_events" ON web_events;

CREATE POLICY "Authenticated users can view web_events" 
ON web_events FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins and moderators can manage web_events" 
ON web_events FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));