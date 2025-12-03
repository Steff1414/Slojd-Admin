-- Additional seeding for members, SMS, and personalized offers

-- Welcome email for all members
INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, sent_at)
SELECT 
  c.id,
  'MEMBER_WELCOME',
  c.email,
  'Välkommen som medlem hos Slöjd-Detaljer!',
  '<h1>Välkommen ' || c.first_name || '!</h1><p>Tack för att du blivit medlem hos oss. Som medlem får du:</p><ul><li>Exklusiva erbjudanden</li><li>Förhandsvisning av nya produkter</li><li>Rabatter på utvalda varor</li></ul><p>Vi ser fram emot att hjälpa dig med ditt skapande!</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
  'SENT',
  'EMAIL',
  'WELCOME',
  c.created_at + INTERVAL '10 minutes'
FROM contacts c
WHERE c.contact_type = 'Medlem'
AND NOT EXISTS (SELECT 1 FROM email_messages em WHERE em.contact_id = c.id AND em.category = 'WELCOME');

-- SMS for contacts who want SMS (Black Week) - for those not already having SMS
INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, sent_at)
SELECT 
  c.id,
  'BLACK_WEEK_SMS',
  COALESCE(c.phone, c.email),
  'Black Week!',
  'Hej ' || c.first_name || '! Black Week är här - 30% på alla produkter! Handla nu på slojd-detaljer.se 🎨',
  'SENT',
  'SMS',
  'OTHER',
  '2024-11-25 10:00:00'::TIMESTAMP
FROM contacts c
WHERE c.wants_sms = true
AND NOT EXISTS (SELECT 1 FROM email_messages em WHERE em.contact_id = c.id AND em.channel = 'SMS');

-- First personalized offer
INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, sent_at)
SELECT 
  c.id,
  'PERSONALIZED_OFFER',
  c.email,
  'Speciellt erbjudande till dig, ' || c.first_name || '!',
  '<h1>Hej ' || c.first_name || '!</h1><p>Baserat på dina tidigare köp har vi ett speciellt erbjudande till dig:</p><p><strong>20% rabatt på produkter inom dina favoritkategorier!</strong></p><p>Använd kod: PERSONAL20 vid kassan.</p><p>Erbjudandet gäller i 7 dagar.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
  'SENT',
  'EMAIL',
  'OTHER',
  NOW() - INTERVAL '30 days'
FROM contacts c
WHERE c.wants_personalized_offers = true
AND NOT EXISTS (SELECT 1 FROM email_messages em WHERE em.contact_id = c.id AND em.type_key = 'PERSONALIZED_OFFER');

-- Second personalized offer
INSERT INTO email_messages (contact_id, type_key, to_email, subject, body, status, channel, category, sent_at)
SELECT 
  c.id,
  'PERSONALIZED_OFFER',
  c.email,
  'Nya erbjudanden för dig, ' || c.first_name || '!',
  '<h1>Hej ' || c.first_name || '!</h1><p>Vi har nya erbjudanden baserat på vad du gillar:</p><p><strong>15% rabatt på nyheter inom Teckna & måla!</strong></p><p>Använd kod: NYHETER15 vid kassan.</p><p>Med vänliga hälsningar,<br>Slöjd-Detaljer</p>',
  'SENT',
  'EMAIL',
  'OTHER',
  NOW() - INTERVAL '14 days'
FROM contacts c
WHERE c.wants_personalized_offers = true
AND (SELECT COUNT(*) FROM email_messages em WHERE em.contact_id = c.id AND em.type_key = 'PERSONALIZED_OFFER') < 2;