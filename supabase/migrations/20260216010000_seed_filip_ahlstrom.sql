-- Seed dummy data for Filip Ahlström
-- 4 orders, 3 emails, 4 SMS, 2 cases, active browsing (hårdvara, garn, verktyg)

DO $$
DECLARE
  v_contact_id UUID := gen_random_uuid();
  v_customer_id UUID := gen_random_uuid();
  v_order1_id UUID := gen_random_uuid();
  v_order2_id UUID := gen_random_uuid();
  v_order3_id UUID := gen_random_uuid();
  v_order4_id UUID := gen_random_uuid();
  v_case1_id UUID := gen_random_uuid();
  v_case2_id UUID := gen_random_uuid();
  v_session1_id UUID := gen_random_uuid();
  v_session2_id UUID := gen_random_uuid();
  v_session3_id UUID := gen_random_uuid();
  v_session4_id UUID := gen_random_uuid();
  v_session5_id UUID := gen_random_uuid();
BEGIN

  -- ========================================
  -- 1. Contact
  -- ========================================
  INSERT INTO contacts (id, voyado_id, first_name, last_name, email, phone, contact_type, wants_sms, wants_newsletter, wants_personalized_offers, web_tracking_consent)
  VALUES (
    v_contact_id,
    'VOY-FILIP-001',
    'Filip',
    'Ahlström',
    'filip.ahlstrom@example.com',
    '0701234567',
    'Privatperson',
    true,
    true,
    true,
    'GRANTED'
  );

  -- ========================================
  -- 2. Customer (Privatperson / B2C)
  -- ========================================
  INSERT INTO customers (id, bc_customer_number, name, customer_category, customer_type_group, is_active)
  VALUES (
    v_customer_id,
    'BC-FILIP-001',
    'Filip Ahlström',
    'Privat',
    'B2C',
    true
  );

  -- ========================================
  -- 3. Link contact → customer
  -- ========================================
  INSERT INTO contact_customer_links (contact_id, customer_id, relationship_type, is_primary)
  VALUES (v_contact_id, v_customer_id, 'PrimaryContact', true);

  -- ========================================
  -- 4. Four orders (spread over last 60 days)
  -- ========================================
  INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at) VALUES
    (v_order1_id, 'ORD-FA-0001', v_customer_id, v_contact_id, 1245.00, 'completed',  NOW() - INTERVAL '52 days'),
    (v_order2_id, 'ORD-FA-0002', v_customer_id, v_contact_id, 789.50,  'completed',  NOW() - INTERVAL '35 days'),
    (v_order3_id, 'ORD-FA-0003', v_customer_id, v_contact_id, 2150.00, 'completed',  NOW() - INTERVAL '18 days'),
    (v_order4_id, 'ORD-FA-0004', v_customer_id, v_contact_id, 465.00,  'pending',    NOW() - INTERVAL '3 days');

  -- ========================================
  -- 5. Order items (hårdvara, garn, verktyg)
  -- ========================================
  -- Order 1: Hårdvara
  INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
    (v_order1_id, 'HW-101', 'Skruvsortiment rostfritt',  'Skruv & fästelement', 'Hårdvara', 2, 189.00, 378.00),
    (v_order1_id, 'HW-102', 'Gångjärn mässing 50mm',     'Beslag',              'Hårdvara', 4, 79.00,  316.00),
    (v_order1_id, 'TL-201', 'Stämjärn 3-pack',           'Handverktyg',         'Verktyg',  1, 551.00, 551.00);

  -- Order 2: Garn + Verktyg
  INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
    (v_order2_id, 'YN-301', 'Bomullsgarn naturvit 200g',  'Vävgarn',     'Garn', 3, 129.50, 388.50),
    (v_order2_id, 'YN-302', 'Lingarn blå 100g',           'Broderigarn', 'Garn', 2, 89.00,  178.00),
    (v_order2_id, 'TL-202', 'Vävspole trä',               'Vävtillbehör','Verktyg', 1, 223.00, 223.00);

  -- Order 3: Verktyg + Hårdvara
  INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
    (v_order3_id, 'TL-203', 'Bandsågsblad 6mm',           'Maskintillbehör', 'Verktyg',  2, 345.00, 690.00),
    (v_order3_id, 'TL-204', 'Slipkloss set',              'Slipverktyg',     'Verktyg',  1, 210.00, 210.00),
    (v_order3_id, 'HW-103', 'Rundstång aluminium 10mm',   'Metall',          'Hårdvara', 5, 250.00, 1250.00);

  -- Order 4: Garn (pending)
  INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
    (v_order4_id, 'YN-303', 'Ullgarn grå 300g',           'Stickgarn', 'Garn', 2, 165.00, 330.00),
    (v_order4_id, 'YN-304', 'Virknål bambu 4mm',          'Tillbehör', 'Garn', 3, 45.00,  135.00);

  -- ========================================
  -- 6. Shipments for completed orders
  -- ========================================
  INSERT INTO shipments (order_id, shipment_number, carrier, tracking_number, tracking_url, status, shipped_at, delivered_at) VALUES
    (v_order1_id, 'SHP-FA-0001', 'PostNord', '12345678901SE', 'https://tracking.postnord.com/12345678901SE', 'DELIVERED', NOW() - INTERVAL '50 days', NOW() - INTERVAL '48 days'),
    (v_order2_id, 'SHP-FA-0002', 'PostNord', '12345678902SE', 'https://tracking.postnord.com/12345678902SE', 'DELIVERED', NOW() - INTERVAL '33 days', NOW() - INTERVAL '31 days'),
    (v_order3_id, 'SHP-FA-0003', 'DHL',      '9876543210',    'https://tracking.dhl.com/9876543210',         'DELIVERED', NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days');

  -- ========================================
  -- 7. Three emails
  -- ========================================
  -- Email 1: Orderbekräftelse order 1
  INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, related_order_id, sent_at)
  VALUES (v_contact_id, 'ORDER_CONFIRMED', 'filip.ahlstrom@example.com',
    'Orderbekräftelse ORD-FA-0001',
    '<h1>Hej Filip!</h1><p>Vi har tagit emot din order ORD-FA-0001.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
    'SENT', 'EMAIL', 'ORDER_CONFIRMATION', v_order1_id, NOW() - INTERVAL '52 days' + INTERVAL '1 hour');

  -- Email 2: Leveransbekräftelse order 3
  INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, related_order_id, sent_at)
  VALUES (v_contact_id, 'DELIVERY_CONFIRMATION', 'filip.ahlstrom@example.com',
    'Din order ORD-FA-0003 har levererats',
    '<h1>Hej Filip!</h1><p>Din order ORD-FA-0003 har nu levererats.</p><p>Tack för att du handlar hos oss!</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
    'SENT', 'EMAIL', 'ORDER_DELIVERED', v_order3_id, NOW() - INTERVAL '14 days');

  -- Email 3: Personaliserat erbjudande
  INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, sent_at)
  VALUES (v_contact_id, 'PERSONALIZED_OFFER', 'filip.ahlstrom@example.com',
    'Speciellt erbjudande till dig, Filip!',
    '<h1>Hej Filip!</h1><p>20% rabatt på verktyg och hårdvara denna vecka!</p><p>Använd kod: FILIP20 vid kassan.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
    'SENT', 'EMAIL', 'OTHER', NOW() - INTERVAL '7 days');

  -- ========================================
  -- 8. Four SMS
  -- ========================================
  INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, sent_at) VALUES
    (v_contact_id, 'BLACK_WEEK_SMS', '0701234567',
     'Black Week!',
     'Hej Filip! Black Week är här - 30% på alla produkter! Handla nu på slojd-detaljer.se',
     'SENT', 'SMS', 'OTHER', NOW() - INTERVAL '45 days'),

    (v_contact_id, 'ORDER_CONFIRMED', '0701234567',
     'Orderbekräftelse',
     'Hej Filip! Din order ORD-FA-0003 är mottagen och behandlas. /Slöjd-Detaljer',
     'SENT', 'SMS', 'ORDER_CONFIRMATION', NOW() - INTERVAL '18 days'),

    (v_contact_id, 'DELIVERY_CONFIRMATION', '0701234567',
     'Leveransavisering',
     'Hej Filip! Ditt paket med order ORD-FA-0003 levereras idag via DHL. Spårning: 9876543210',
     'SENT', 'SMS', 'ORDER_DELIVERED', NOW() - INTERVAL '14 days'),

    (v_contact_id, 'PERSONALIZED_OFFER', '0701234567',
     'Erbjudande',
     'Hej Filip! Nytt sortiment verktyg och garn - 15% med kod VAREN15. Gäller t.o.m. söndag! /Slöjd-Detaljer',
     'SENT', 'SMS', 'OTHER', NOW() - INTERVAL '5 days');

  -- ========================================
  -- 9. Two cases (linked to order 2 and order 3)
  -- ========================================
  -- Case 1: Felaktig leverans på order 2
  INSERT INTO cases (id, contact_id, customer_id, order_id, subject, description, status, priority, channel, created_at, updated_at, closed_at)
  VALUES (v_case1_id, v_contact_id, v_customer_id, v_order2_id,
    'Fel vara levererad - ORD-FA-0002',
    'Kund mottog felaktigt garn (röd istället för blå). Önskar byte.',
    'RESOLVED', 'NORMAL', 'EMAIL',
    NOW() - INTERVAL '30 days', NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days');

  -- Case 1 messages
  INSERT INTO case_messages (case_id, direction, message_type, body, created_at) VALUES
    (v_case1_id, 'INBOUND', 'EMAIL',
     'Hej! Jag beställde blått lingarn men fick rött. Ordernummer ORD-FA-0002. Kan ni skicka rätt färg?',
     NOW() - INTERVAL '30 days'),
    (v_case1_id, 'OUTBOUND', 'EMAIL',
     'Hej Filip! Tack för att du hör av dig. Vi beklagar felet och skickar rätt vara direkt. Du behöver inte returnera den felaktiga.',
     NOW() - INTERVAL '29 days'),
    (v_case1_id, 'INBOUND', 'EMAIL',
     'Tack för snabb hantering! Rätt garn har kommit fram. Ni är bäst!',
     NOW() - INTERVAL '27 days');

  -- Case 2: Trasig produkt i order 3
  INSERT INTO cases (id, contact_id, customer_id, order_id, subject, description, status, priority, channel, created_at, updated_at)
  VALUES (v_case2_id, v_contact_id, v_customer_id, v_order3_id,
    'Skadat bandsågsblad - ORD-FA-0003',
    'Ett av bandsågsbladen var böjt vid leverans. Kund önskar ersättning.',
    'OPEN', 'HIGH', 'PHONE',
    NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days');

  -- Case 2 messages
  INSERT INTO case_messages (case_id, direction, message_type, body, created_at) VALUES
    (v_case2_id, 'INBOUND', 'PHONE_CALL',
     'Kund ringer och meddelar att ett av bandsågsbladen (6mm) i order ORD-FA-0003 var böjt vid uppackning. Vill ha ersättning.',
     NOW() - INTERVAL '12 days'),
    (v_case2_id, 'INTERNAL_NOTE', 'NOTE',
     'Kontrollerat lagerstatus - nytt bandsågsblad finns i lager. Inväntar godkännande för att skicka ersättning utan retur.',
     NOW() - INTERVAL '10 days');

  -- ========================================
  -- 10. Web sessions & events (last 30 days)
  --     Aktivt surfande: hårdvara, garn, verktyg
  -- ========================================

  -- Session 1: 25 dagar sedan - browsade hårdvara
  INSERT INTO web_sessions (id, contact_id, session_token, started_at, ended_at)
  VALUES (v_session1_id, v_contact_id, 'sess-fa-001', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days' + INTERVAL '22 minutes');

  INSERT INTO web_events (session_id, event_type, url, product_id, product_name, category_name, occurred_at, visit_index) VALUES
    (v_session1_id, 'CATEGORY_VIEW', '/hardvara', NULL, NULL, 'Hårdvara', NOW() - INTERVAL '25 days', 1),
    (v_session1_id, 'PRODUCT_VIEW',  '/hardvara/skruv-rostfritt', 'HW-101', 'Skruvsortiment rostfritt', 'Hårdvara', NOW() - INTERVAL '25 days' + INTERVAL '3 minutes', 2),
    (v_session1_id, 'PRODUCT_VIEW',  '/hardvara/beslagset-garderob', 'HW-110', 'Beslagset garderob', 'Hårdvara', NOW() - INTERVAL '25 days' + INTERVAL '8 minutes', 3),
    (v_session1_id, 'CATEGORY_VIEW', '/verktyg', NULL, NULL, 'Verktyg', NOW() - INTERVAL '25 days' + INTERVAL '12 minutes', 4),
    (v_session1_id, 'PRODUCT_VIEW',  '/verktyg/sticksaw-pro', 'TL-210', 'Sticksåg Pro', 'Verktyg', NOW() - INTERVAL '25 days' + INTERVAL '15 minutes', 5);

  -- Session 2: 18 dagar sedan - browsade garn
  INSERT INTO web_sessions (id, contact_id, session_token, started_at, ended_at)
  VALUES (v_session2_id, v_contact_id, 'sess-fa-002', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '15 minutes');

  INSERT INTO web_events (session_id, event_type, url, product_id, product_name, category_name, occurred_at, visit_index) VALUES
    (v_session2_id, 'CATEGORY_VIEW', '/garn', NULL, NULL, 'Garn', NOW() - INTERVAL '18 days', 1),
    (v_session2_id, 'PRODUCT_VIEW',  '/garn/ullgarn-gra', 'YN-303', 'Ullgarn grå 300g', 'Garn', NOW() - INTERVAL '18 days' + INTERVAL '2 minutes', 2),
    (v_session2_id, 'PRODUCT_VIEW',  '/garn/virknal-bambu', 'YN-304', 'Virknål bambu 4mm', 'Garn', NOW() - INTERVAL '18 days' + INTERVAL '6 minutes', 3),
    (v_session2_id, 'ADD_TO_CART',   '/garn/ullgarn-gra', 'YN-303', 'Ullgarn grå 300g', 'Garn', NOW() - INTERVAL '18 days' + INTERVAL '8 minutes', 4),
    (v_session2_id, 'CHECKOUT_START','/checkout', NULL, NULL, NULL, NOW() - INTERVAL '18 days' + INTERVAL '10 minutes', 5);

  -- Session 3: 10 dagar sedan - browsade verktyg + hårdvara
  INSERT INTO web_sessions (id, contact_id, session_token, started_at, ended_at)
  VALUES (v_session3_id, v_contact_id, 'sess-fa-003', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '30 minutes');

  INSERT INTO web_events (session_id, event_type, url, product_id, product_name, category_name, occurred_at, visit_index) VALUES
    (v_session3_id, 'CATEGORY_VIEW', '/verktyg', NULL, NULL, 'Verktyg', NOW() - INTERVAL '10 days', 1),
    (v_session3_id, 'PRODUCT_VIEW',  '/verktyg/bandsagsblad-12mm', 'TL-205', 'Bandsågsblad 12mm', 'Verktyg', NOW() - INTERVAL '10 days' + INTERVAL '4 minutes', 2),
    (v_session3_id, 'PRODUCT_VIEW',  '/verktyg/slipmaskin-kompakt', 'TL-206', 'Slipmaskin kompakt', 'Verktyg', NOW() - INTERVAL '10 days' + INTERVAL '9 minutes', 3),
    (v_session3_id, 'CATEGORY_VIEW', '/hardvara', NULL, NULL, 'Hårdvara', NOW() - INTERVAL '10 days' + INTERVAL '14 minutes', 4),
    (v_session3_id, 'PRODUCT_VIEW',  '/hardvara/aluminiumprofil-20x20', 'HW-104', 'Aluminiumprofil 20x20mm', 'Hårdvara', NOW() - INTERVAL '10 days' + INTERVAL '18 minutes', 5),
    (v_session3_id, 'PRODUCT_VIEW',  '/hardvara/popnit-set', 'HW-105', 'Popnit set aluminium', 'Hårdvara', NOW() - INTERVAL '10 days' + INTERVAL '22 minutes', 6),
    (v_session3_id, 'ADD_TO_CART',   '/verktyg/slipmaskin-kompakt', 'TL-206', 'Slipmaskin kompakt', 'Verktyg', NOW() - INTERVAL '10 days' + INTERVAL '25 minutes', 7);

  -- Session 4: 4 dagar sedan - browsade garn + verktyg
  INSERT INTO web_sessions (id, contact_id, session_token, started_at, ended_at)
  VALUES (v_session4_id, v_contact_id, 'sess-fa-004', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '18 minutes');

  INSERT INTO web_events (session_id, event_type, url, product_id, product_name, category_name, occurred_at, visit_index) VALUES
    (v_session4_id, 'CATEGORY_VIEW', '/garn', NULL, NULL, 'Garn', NOW() - INTERVAL '4 days', 1),
    (v_session4_id, 'PRODUCT_VIEW',  '/garn/lingarn-rod-100g', 'YN-305', 'Lingarn röd 100g', 'Garn', NOW() - INTERVAL '4 days' + INTERVAL '3 minutes', 2),
    (v_session4_id, 'PRODUCT_VIEW',  '/garn/bomullsgarn-svart', 'YN-306', 'Bomullsgarn svart 200g', 'Garn', NOW() - INTERVAL '4 days' + INTERVAL '7 minutes', 3),
    (v_session4_id, 'CATEGORY_VIEW', '/verktyg', NULL, NULL, 'Verktyg', NOW() - INTERVAL '4 days' + INTERVAL '10 minutes', 4),
    (v_session4_id, 'PRODUCT_VIEW',  '/verktyg/mejsel-set-6st', 'TL-207', 'Mejselset 6 st', 'Verktyg', NOW() - INTERVAL '4 days' + INTERVAL '14 minutes', 5);

  -- Session 5: igår - aktiv på hårdvara
  INSERT INTO web_sessions (id, contact_id, session_token, started_at, ended_at)
  VALUES (v_session5_id, v_contact_id, 'sess-fa-005', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '12 minutes');

  INSERT INTO web_events (session_id, event_type, url, product_id, product_name, category_name, occurred_at, visit_index) VALUES
    (v_session5_id, 'PAGE_VIEW',     '/', NULL, NULL, NULL, NOW() - INTERVAL '1 day', 1),
    (v_session5_id, 'CATEGORY_VIEW', '/hardvara', NULL, NULL, 'Hårdvara', NOW() - INTERVAL '1 day' + INTERVAL '2 minutes', 2),
    (v_session5_id, 'PRODUCT_VIEW',  '/hardvara/gangjarns-kit', 'HW-106', 'Gångjärnskit dörr', 'Hårdvara', NOW() - INTERVAL '1 day' + INTERVAL '5 minutes', 3),
    (v_session5_id, 'PRODUCT_VIEW',  '/hardvara/trasskruv-50mm', 'HW-107', 'Träskruv 50mm 200st', 'Hårdvara', NOW() - INTERVAL '1 day' + INTERVAL '8 minutes', 4),
    (v_session5_id, 'ADD_TO_CART',   '/hardvara/trasskruv-50mm', 'HW-107', 'Träskruv 50mm 200st', 'Hårdvara', NOW() - INTERVAL '1 day' + INTERVAL '10 minutes', 5);

END $$;
