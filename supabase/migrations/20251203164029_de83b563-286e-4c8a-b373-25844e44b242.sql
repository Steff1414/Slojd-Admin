-- Phase 4 Demo Data Seeding (Fixed)
-- This migration creates comprehensive demo data for communication flows

-- First, let's ensure we have proper email templates
INSERT INTO email_templates (template_key, name, subject_template, body_template, description, is_active, category)
VALUES 
  ('DELIVERY_CONFIRMATION', 'Leveransbekräftelse', 'Din order {{orderNumber}} har levererats', 
   '<h1>Hej {{firstName}}!</h1><p>Din order {{orderNumber}} har nu levererats till dig.</p><p>Tack för att du handlar hos oss!</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>', 
   'Bekräftelse när order levererats', true, 'ORDER_DELIVERED'),
  ('MEMBER_WELCOME', 'Välkommen som medlem', 'Välkommen som medlem hos Slöjd-Detaljer!', 
   '<h1>Välkommen {{firstName}}!</h1><p>Tack för att du blivit medlem hos oss. Som medlem får du:</p><ul><li>Exklusiva erbjudanden</li><li>Förhandsvisning av nya produkter</li><li>Rabatter på utvalda varor</li></ul><p>Vi ser fram emot att hjälpa dig med ditt skapande!</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>', 
   'Välkomstmail till nya medlemmar', true, 'WELCOME'),
  ('BLACK_WEEK_SMS', 'Black Week SMS', 'Black Week hos Slöjd-Detaljer!', 
   'Hej {{firstName}}! Black Week är här - 30% på alla produkter! Handla nu på slojd-detaljer.se 🎨', 
   'SMS-kampanj för Black Week', true, 'OTHER'),
  ('PERSONALIZED_OFFER', 'Personaliserat erbjudande', 'Speciellt erbjudande till dig, {{firstName}}!', 
   '<h1>Hej {{firstName}}!</h1><p>Baserat på dina tidigare köp har vi ett speciellt erbjudande till dig:</p><p><strong>20% rabatt på produkter inom dina favoritkategorier!</strong></p><p>Använd kod: PERSONAL20 vid kassan.</p><p>Erbjudandet gäller i 7 dagar.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>', 
   'Personaliserat erbjudande baserat på köphistorik', true, 'OTHER')
ON CONFLICT (template_key) DO NOTHING;

-- Create a function to generate demo data with unique order numbers
CREATE OR REPLACE FUNCTION seed_phase4_demo_data_v2()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_customer RECORD;
  v_contact RECORD;
  v_teacher RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_school RECORD;
  v_max_order_num INT;
  v_counter INT;
BEGIN
  -- Get the max existing order number to avoid duplicates
  SELECT COALESCE(MAX(SUBSTRING(order_number FROM '[0-9]+')::INT), 0) + 1000 INTO v_counter FROM orders;

  -- Loop through all customers to ensure they have orders
  FOR v_customer IN SELECT * FROM customers LOOP
    -- Check if customer has any orders
    IF NOT EXISTS (SELECT 1 FROM orders WHERE customer_id = v_customer.id) THEN
      -- Find a contact for this customer
      SELECT c.* INTO v_contact 
      FROM contacts c
      JOIN contact_customer_links ccl ON ccl.contact_id = c.id
      WHERE ccl.customer_id = v_customer.id
      LIMIT 1;
      
      -- Only create order if we found a contact
      IF v_contact.id IS NOT NULL THEN
        v_order_number := 'ORD-' || LPAD(v_counter::TEXT, 6, '0');
        v_counter := v_counter + 1;
        
        INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
        VALUES (
          gen_random_uuid(),
          v_order_number,
          v_customer.id,
          v_contact.id,
          (RANDOM() * 2000 + 200)::NUMERIC(10,2),
          'completed',
          NOW() - (RANDOM() * 90)::INT * INTERVAL '1 day'
        )
        RETURNING id INTO v_order_id;
        
        -- Add order items
        INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total)
        VALUES 
          (v_order_id, 'PROD-' || (RANDOM() * 1000)::INT, 'Akrylfärg Set', 'Akrylfärg', 'Teckna & måla', (RANDOM() * 3 + 1)::INT, 149.00, 149.00 * (RANDOM() * 3 + 1)::INT),
          (v_order_id, 'PROD-' || (RANDOM() * 1000)::INT, 'Penslar Syntet', 'Penslar', 'Teckna & måla', (RANDOM() * 5 + 1)::INT, 89.00, 89.00 * (RANDOM() * 5 + 1)::INT);
      END IF;
    END IF;
  END LOOP;

  -- For all contacts with orders, send order confirmation, delivery confirmation and receipt
  FOR v_contact IN 
    SELECT DISTINCT c.* 
    FROM contacts c
    JOIN orders o ON o.buyer_contact_id = c.id
  LOOP
    -- Order confirmation
    IF NOT EXISTS (SELECT 1 FROM email_messages WHERE contact_id = v_contact.id AND category = 'ORDER_CONFIRMATION') THEN
      INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, related_order_id, sent_at)
      SELECT 
        v_contact.id,
        'ORDER_CONFIRMED',
        v_contact.email,
        'Orderbekräftelse ' || o.order_number,
        '<h1>Hej ' || v_contact.first_name || '!</h1><p>Vi har tagit emot din order ' || o.order_number || '.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
        'SENT',
        'EMAIL',
        'ORDER_CONFIRMATION',
        o.id,
        o.created_at + INTERVAL '1 hour'
      FROM orders o
      WHERE o.buyer_contact_id = v_contact.id
      LIMIT 1;
    END IF;
    
    -- Delivery confirmation
    IF NOT EXISTS (SELECT 1 FROM email_messages WHERE contact_id = v_contact.id AND category = 'ORDER_DELIVERED') THEN
      INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, related_order_id, sent_at)
      SELECT 
        v_contact.id,
        'DELIVERY_CONFIRMATION',
        v_contact.email,
        'Din order ' || o.order_number || ' har levererats',
        '<h1>Hej ' || v_contact.first_name || '!</h1><p>Din order ' || o.order_number || ' har nu levererats till dig.</p><p>Tack för att du handlar hos oss!</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
        'SENT',
        'EMAIL',
        'ORDER_DELIVERED',
        o.id,
        o.created_at + INTERVAL '3 days'
      FROM orders o
      WHERE o.buyer_contact_id = v_contact.id
      LIMIT 1;
    END IF;
    
    -- Receipt
    IF NOT EXISTS (SELECT 1 FROM email_messages WHERE contact_id = v_contact.id AND category = 'RECEIPT') THEN
      INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, related_order_id, sent_at)
      SELECT 
        v_contact.id,
        'RECEIPT',
        v_contact.email,
        'Kvitto för order ' || o.order_number,
        '<h1>Kvitto</h1><p>Hej ' || v_contact.first_name || '!</p><p>Här är ditt kvitto för order ' || o.order_number || '.</p><p>Totalt: ' || o.total_amount || ' kr</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
        'SENT',
        'EMAIL',
        'RECEIPT',
        o.id,
        o.created_at + INTERVAL '3 days 1 hour'
      FROM orders o
      WHERE o.buyer_contact_id = v_contact.id
      LIMIT 1;
    END IF;
  END LOOP;

  -- Welcome email for all members
  FOR v_contact IN SELECT * FROM contacts WHERE contact_type = 'Medlem' LOOP
    IF NOT EXISTS (SELECT 1 FROM email_messages WHERE contact_id = v_contact.id AND category = 'WELCOME') THEN
      INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, sent_at)
      VALUES (
        v_contact.id,
        'MEMBER_WELCOME',
        v_contact.email,
        'Välkommen som medlem hos Slöjd-Detaljer!',
        '<h1>Välkommen ' || v_contact.first_name || '!</h1><p>Tack för att du blivit medlem hos oss. Som medlem får du:</p><ul><li>Exklusiva erbjudanden</li><li>Förhandsvisning av nya produkter</li><li>Rabatter på utvalda varor</li></ul><p>Vi ser fram emot att hjälpa dig med ditt skapande!</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
        'SENT',
        'EMAIL',
        'WELCOME',
        v_contact.created_at + INTERVAL '10 minutes'
      );
    END IF;
  END LOOP;

  -- SMS for contacts who want SMS (Black Week)
  FOR v_contact IN SELECT * FROM contacts WHERE wants_sms = true LOOP
    IF NOT EXISTS (SELECT 1 FROM email_messages WHERE contact_id = v_contact.id AND channel = 'SMS') THEN
      INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, sent_at)
      VALUES (
        v_contact.id,
        'BLACK_WEEK_SMS',
        COALESCE(v_contact.phone, v_contact.email),
        'Black Week!',
        'Hej ' || v_contact.first_name || '! Black Week är här - 30% på alla produkter! Handla nu på slojd-detaljer.se 🎨',
        'SENT',
        'SMS',
        'OTHER',
        '2024-11-25 10:00:00'::TIMESTAMP
      );
    END IF;
  END LOOP;

  -- Personalized offers for contacts who accept them (2 per contact)
  FOR v_contact IN SELECT * FROM contacts WHERE wants_personalized_offers = true LOOP
    -- First offer
    IF (SELECT COUNT(*) FROM email_messages WHERE contact_id = v_contact.id AND type_key = 'PERSONALIZED_OFFER') < 1 THEN
      INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, sent_at)
      VALUES (
        v_contact.id,
        'PERSONALIZED_OFFER',
        v_contact.email,
        'Speciellt erbjudande till dig, ' || v_contact.first_name || '!',
        '<h1>Hej ' || v_contact.first_name || '!</h1><p>Baserat på dina tidigare köp har vi ett speciellt erbjudande till dig:</p><p><strong>20% rabatt på produkter inom dina favoritkategorier!</strong></p><p>Använd kod: PERSONAL20 vid kassan.</p><p>Erbjudandet gäller i 7 dagar.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
        'SENT',
        'EMAIL',
        'OTHER',
        NOW() - INTERVAL '30 days'
      );
    END IF;
    
    -- Second offer
    IF (SELECT COUNT(*) FROM email_messages WHERE contact_id = v_contact.id AND type_key = 'PERSONALIZED_OFFER') < 2 THEN
      INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, sent_at)
      VALUES (
        v_contact.id,
        'PERSONALIZED_OFFER',
        v_contact.email,
        'Nya erbjudanden för dig, ' || v_contact.first_name || '!',
        '<h1>Hej ' || v_contact.first_name || '!</h1><p>Vi har nya erbjudanden baserat på vad du gillar:</p><p><strong>15% rabatt på nyheter inom Teckna & måla!</strong></p><p>Använd kod: NYHETER15 vid kassan.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
        'SENT',
        'EMAIL',
        'OTHER',
        NOW() - INTERVAL '14 days'
      );
    END IF;
  END LOOP;

  -- Teachers buying for their schools
  FOR v_teacher IN 
    SELECT c.*, tsa.school_customer_id 
    FROM contacts c
    JOIN teacher_school_assignments tsa ON tsa.teacher_contact_id = c.id
    WHERE c.is_teacher = true AND tsa.is_active = true
  LOOP
    -- Get the school
    SELECT cust.* INTO v_school 
    FROM customers cust 
    WHERE cust.id = v_teacher.school_customer_id;
    
    -- Check if teacher has made a purchase for the school
    IF v_school.id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM orders WHERE buyer_contact_id = v_teacher.id AND customer_id = v_teacher.school_customer_id) THEN
      v_order_number := 'SCH-' || LPAD(v_counter::TEXT, 6, '0');
      v_counter := v_counter + 1;
      
      INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
      VALUES (
        gen_random_uuid(),
        v_order_number,
        v_teacher.school_customer_id,
        v_teacher.id,
        (RANDOM() * 5000 + 500)::NUMERIC(10,2),
        'completed',
        NOW() - (RANDOM() * 60)::INT * INTERVAL '1 day'
      )
      RETURNING id INTO v_order_id;
      
      -- Add school-relevant order items
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total)
      VALUES 
        (v_order_id, 'PROD-SCH-' || (RANDOM() * 100)::INT, 'Klassrumsset Akrylfärg', 'Färg', 'Teckna & måla', 10, 249.00, 2490.00),
        (v_order_id, 'PROD-SCH-' || (RANDOM() * 100)::INT, 'Träslöjdsverktyg Bas', 'Handverktyg', 'Trä & metall', 15, 189.00, 2835.00);
      
      -- Send order confirmation to teacher for school order
      INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, related_order_id, sent_at)
      VALUES (
        v_teacher.id,
        'ORDER_CONFIRMED',
        v_teacher.email,
        'Orderbekräftelse ' || v_order_number || ' - ' || v_school.name,
        '<h1>Hej ' || v_teacher.first_name || '!</h1><p>Din order ' || v_order_number || ' för ' || v_school.name || ' har bekräftats.</p><p>Ordern faktureras till skolans betalare.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
        'SENT',
        'EMAIL',
        'ORDER_CONFIRMATION',
        v_order_id,
        NOW() - (RANDOM() * 60)::INT * INTERVAL '1 day' + INTERVAL '1 hour'
      );
    END IF;
  END LOOP;
END;
$$;

-- Execute the seeding function
SELECT seed_phase4_demo_data_v2();

-- Clean up the function after use
DROP FUNCTION IF EXISTS seed_phase4_demo_data_v2();