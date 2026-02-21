-- ============================================================
-- Slöjd-Admin: Seed data (Swedish dummy data)
-- ============================================================

-- Clean existing data (in dependency order)
DELETE FROM public.teacher_school_assignments;
DELETE FROM public.contact_customer_links;
DELETE FROM public.orders;
DELETE FROM public.accounts;
DELETE FROM public.agreements;
DELETE FROM public.contacts WHERE merged_into_id IS NOT NULL;
DELETE FROM public.contacts;
DELETE FROM public.customers;

-- ============================================================
-- 1. CUSTOMERS — Mix of categories
-- ============================================================

-- Schools (Skola / B2G)
INSERT INTO public.customers (id, bc_customer_number, name, customer_category, customer_type_group, norce_code, is_active) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'BC-10001', 'Stockholms Slöjdskola', 'Skola', 'B2G', 'NC-S001', true),
  ('a0000001-0000-0000-0000-000000000002', 'BC-10002', 'Göteborgs Montessoriskola', 'Skola', 'B2G', 'NC-S002', true),
  ('a0000001-0000-0000-0000-000000000003', 'BC-10003', 'Malmö Waldorfskola', 'Skola', 'B2G', 'NC-S003', true),
  ('a0000001-0000-0000-0000-000000000004', 'BC-10004', 'Uppsala Friskola', 'Skola', 'B2G', 'NC-S004', true),
  ('a0000001-0000-0000-0000-000000000005', 'BC-10005', 'Lunds Tekniska Gymnasium', 'Skola', 'B2G', 'NC-S005', true),
  ('a0000001-0000-0000-0000-000000000006', 'BC-10006', 'Norrköpings Slöjdgymnasium', 'Skola', 'B2G', 'NC-S006', false),
  ('a0000001-0000-0000-0000-000000000007', 'BC-10007', 'Jönköpings Kulturskola', 'Skola', 'B2G', 'NC-S007', true),
  ('a0000001-0000-0000-0000-000000000008', 'BC-10008', 'Umeå Grundskola Öst', 'Skola', 'B2G', 'NC-S008', true);

-- Companies (Företag / B2B)
INSERT INTO public.customers (id, bc_customer_number, name, customer_category, customer_type_group, norce_code, is_active) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'BC-20001', 'Kreativa Verkstaden AB', 'Företag', 'B2B', 'NC-F001', true),
  ('b0000001-0000-0000-0000-000000000002', 'BC-20002', 'Nordisk Träslöjd AB', 'Företag', 'B2B', 'NC-F002', true),
  ('b0000001-0000-0000-0000-000000000003', 'BC-20003', 'Hantverksbutiken i Gamla Stan', 'Företag', 'B2B', 'NC-F003', true),
  ('b0000001-0000-0000-0000-000000000004', 'BC-20004', 'Svenska Slöjdföreningen', 'Förening', 'B2B', 'NC-F004', true),
  ('b0000001-0000-0000-0000-000000000005', 'BC-20005', 'Konsthantverkarna Ekonomisk Förening', 'Förening', 'B2B', 'NC-F005', true);

-- Kommun och Region (B2G)
INSERT INTO public.customers (id, bc_customer_number, name, customer_category, customer_type_group, norce_code, is_active) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'BC-30001', 'Stockholms Kommun — Utbildningsförvaltningen', 'Kommun och Region', 'B2G', 'NC-K001', true),
  ('c0000001-0000-0000-0000-000000000002', 'BC-30002', 'Västra Götalandsregionen', 'Kommun och Region', 'B2G', 'NC-K002', true),
  ('c0000001-0000-0000-0000-000000000003', 'BC-30003', 'Malmö Stad — Kulturförvaltningen', 'Kommun och Region', 'B2G', 'NC-K003', true);

-- Omsorg (B2G) — these act as payers
INSERT INTO public.customers (id, bc_customer_number, name, customer_category, customer_type_group, norce_code, is_active) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'BC-40001', 'Stockholms Omsorgsförvaltning', 'Omsorg', 'B2G', 'NC-O001', true),
  ('d0000001-0000-0000-0000-000000000002', 'BC-40002', 'Göteborgs Omsorgsbolag', 'Omsorg', 'B2G', 'NC-O002', true);

-- Private / Personal (B2C)
INSERT INTO public.customers (id, bc_customer_number, name, customer_category, customer_type_group, norce_code, is_active) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'BC-50001', 'Anna Lindström', 'Privat', 'B2C', 'NC-P001', true),
  ('e0000001-0000-0000-0000-000000000002', 'BC-50002', 'Erik Johansson', 'Privat', 'B2C', 'NC-P002', true),
  ('e0000001-0000-0000-0000-000000000003', 'BC-50003', 'Maria Svensson', 'Personal', 'B2C', 'NC-P003', true),
  ('e0000001-0000-0000-0000-000000000004', 'BC-50004', 'Johan Bergström', 'Personal', 'B2C', 'NC-P004', true);

-- UF / ÅF (B2B)
INSERT INTO public.customers (id, bc_customer_number, name, customer_category, customer_type_group, norce_code, is_active) VALUES
  ('f0000001-0000-0000-0000-000000000001', 'BC-60001', 'SlöjdKraft UF', 'UF', 'B2B', 'NC-U001', true),
  ('f0000001-0000-0000-0000-000000000002', 'BC-60002', 'TräDröm UF', 'UF', 'B2B', 'NC-U002', true),
  ('f0000001-0000-0000-0000-000000000003', 'BC-60003', 'Sörmlands Hantverk ÅF', 'ÅF', 'B2B', 'NC-A001', true);

-- Set payer relationships (some schools have payers)
UPDATE public.customers SET payer_customer_id = 'c0000001-0000-0000-0000-000000000001' WHERE id IN ('a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004');
UPDATE public.customers SET payer_customer_id = 'c0000001-0000-0000-0000-000000000002' WHERE id IN ('a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007');
UPDATE public.customers SET payer_customer_id = 'c0000001-0000-0000-0000-000000000003' WHERE id IN ('a0000001-0000-0000-0000-000000000003');
UPDATE public.customers SET payer_customer_id = 'd0000001-0000-0000-0000-000000000001' WHERE id = 'a0000001-0000-0000-0000-000000000005';
UPDATE public.customers SET payer_customer_id = 'd0000001-0000-0000-0000-000000000002' WHERE id = 'a0000001-0000-0000-0000-000000000008';

-- ============================================================
-- 2. CONTACTS — Teachers, buyers, private persons, newsletter
-- ============================================================

-- Teachers
INSERT INTO public.contacts (id, voyado_id, first_name, last_name, email, phone, contact_type, is_teacher, wants_sms, wants_newsletter, wants_personalized_offers) VALUES
  ('10000001-0000-0000-0000-000000000001', 'VOY-T001', 'Karin', 'Andersson', 'karin.andersson@stockholmsslojd.se', '070-123 45 01', 'Lärare', true, true, true, false),
  ('10000001-0000-0000-0000-000000000002', 'VOY-T002', 'Per', 'Nilsson', 'per.nilsson@goteborgmontessori.se', '070-123 45 02', 'Lärare', true, false, true, true),
  ('10000001-0000-0000-0000-000000000003', 'VOY-T003', 'Eva', 'Larsson', 'eva.larsson@malmowaldorf.se', '070-123 45 03', 'Lärare', true, true, true, false),
  ('10000001-0000-0000-0000-000000000004', 'VOY-T004', 'Anders', 'Eriksson', 'anders.eriksson@uppsalafriskola.se', '070-123 45 04', 'Lärare', true, false, true, false),
  ('10000001-0000-0000-0000-000000000005', 'VOY-T005', 'Lena', 'Olsson', 'lena.olsson@lundstekniska.se', '070-123 45 05', 'Lärare', true, true, true, true),
  ('10000001-0000-0000-0000-000000000006', 'VOY-T006', 'Magnus', 'Pettersson', 'magnus.pettersson@norrkopingslojd.se', '070-123 45 06', 'Lärare', true, false, false, false),
  ('10000001-0000-0000-0000-000000000007', 'VOY-T007', 'Sara', 'Gustafsson', 'sara.gustafsson@jonkopingkultur.se', '070-123 45 07', 'Lärare', true, true, true, false),
  ('10000001-0000-0000-0000-000000000008', 'VOY-T008', 'Björn', 'Svensson', 'bjorn.svensson@umeagrundskola.se', '070-123 45 08', 'Lärare', true, false, true, false),
  ('10000001-0000-0000-0000-000000000009', 'VOY-T009', 'Ingrid', 'Holm', 'ingrid.holm@stockholmsslojd.se', '070-123 45 09', 'Lärare', true, true, true, true),
  ('10000001-0000-0000-0000-000000000010', 'VOY-T010', 'Henrik', 'Berg', 'henrik.berg@goteborgmontessori.se', '070-123 45 10', 'Lärare', true, false, true, false);

-- Buyers (Köpare) — contacts that buy on behalf of companies
INSERT INTO public.contacts (id, voyado_id, first_name, last_name, email, phone, contact_type, is_teacher, wants_sms, wants_newsletter, wants_personalized_offers) VALUES
  ('20000001-0000-0000-0000-000000000001', 'VOY-B001', 'Sofia', 'Lindqvist', 'sofia.lindqvist@kreativaverkstaden.se', '070-234 56 01', 'Köpare', false, true, true, true),
  ('20000001-0000-0000-0000-000000000002', 'VOY-B002', 'Niklas', 'Ström', 'niklas.strom@nordisktraslojd.se', '070-234 56 02', 'Köpare', false, false, true, false),
  ('20000001-0000-0000-0000-000000000003', 'VOY-B003', 'Gunilla', 'Fransson', 'gunilla.fransson@hantverksbutiken.se', '070-234 56 03', 'Köpare', false, true, false, true),
  ('20000001-0000-0000-0000-000000000004', 'VOY-B004', 'Thomas', 'Ekström', 'thomas.ekstrom@stockholmkommun.se', '070-234 56 04', 'Köpare', false, false, true, false),
  ('20000001-0000-0000-0000-000000000005', 'VOY-B005', 'Cecilia', 'Dahl', 'cecilia.dahl@vgregion.se', '070-234 56 05', 'Köpare', false, true, true, false);

-- Private persons / Members
INSERT INTO public.contacts (id, voyado_id, first_name, last_name, email, phone, contact_type, is_teacher, wants_sms, wants_newsletter, wants_personalized_offers) VALUES
  ('30000001-0000-0000-0000-000000000001', 'VOY-P001', 'Anna', 'Lindström', 'anna.lindstrom@gmail.com', '070-345 67 01', 'Privatperson', false, true, true, true),
  ('30000001-0000-0000-0000-000000000002', 'VOY-P002', 'Erik', 'Johansson', 'erik.johansson@outlook.com', '070-345 67 02', 'Privatperson', false, false, true, false),
  ('30000001-0000-0000-0000-000000000003', 'VOY-P003', 'Maria', 'Svensson', 'maria.svensson@hotmail.com', '070-345 67 03', 'Medlem', false, true, true, true),
  ('30000001-0000-0000-0000-000000000004', 'VOY-P004', 'Johan', 'Bergström', 'johan.bergstrom@telia.se', '070-345 67 04', 'Medlem', false, false, true, false);

-- Newsletter subscribers
INSERT INTO public.contacts (id, voyado_id, first_name, last_name, email, phone, contact_type, is_teacher, wants_sms, wants_newsletter, wants_personalized_offers) VALUES
  ('40000001-0000-0000-0000-000000000001', 'VOY-N001', 'Lisa', 'Wallin', 'lisa.wallin@yahoo.se', NULL, 'Nyhetsbrev', false, false, true, false),
  ('40000001-0000-0000-0000-000000000002', 'VOY-N002', 'Ola', 'Sandberg', 'ola.sandberg@gmail.com', NULL, 'Nyhetsbrev', false, false, true, false),
  ('40000001-0000-0000-0000-000000000003', 'VOY-N003', 'Mia', 'Forsberg', 'mia.forsberg@live.se', NULL, 'Nyhetsbrev', false, false, true, true),
  ('40000001-0000-0000-0000-000000000004', 'VOY-N004', 'Peter', 'Åberg', 'peter.aberg@icloud.com', '070-456 78 04', 'Nyhetsbrev', false, true, true, false),
  ('40000001-0000-0000-0000-000000000005', 'VOY-N005', 'Elin', 'Sjöberg', 'elin.sjoberg@proton.me', NULL, 'Nyhetsbrev', false, false, true, false);

-- Other / misc contacts
INSERT INTO public.contacts (id, voyado_id, first_name, last_name, email, phone, contact_type, is_teacher, wants_sms, wants_newsletter, wants_personalized_offers) VALUES
  ('50000001-0000-0000-0000-000000000001', 'VOY-O001', 'Oscar', 'Lund', 'oscar.lund@slojdkraft.uf.se', '070-567 89 01', 'Övrig', false, false, false, false),
  ('50000001-0000-0000-0000-000000000002', 'VOY-O002', 'Frida', 'Nyström', 'frida.nystrom@tradrom.uf.se', '070-567 89 02', 'Övrig', false, false, true, false);

-- ============================================================
-- 3. TEACHER–SCHOOL ASSIGNMENTS
-- ============================================================
INSERT INTO public.teacher_school_assignments (teacher_contact_id, school_customer_id, role, is_active) VALUES
  ('10000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Slöjdlärare', true),
  ('10000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000001', 'Bildlärare', true),
  ('10000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Slöjdlärare', true),
  ('10000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000002', 'Textillärare', true),
  ('10000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'Slöjdlärare', true),
  ('10000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'Trä- och metallslöjd', true),
  ('10000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'Teknik och design', true),
  ('10000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'Slöjdlärare', false),
  ('10000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', 'Slöjd och bild', true),
  ('10000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', 'Slöjdlärare', true);

-- ============================================================
-- 4. CONTACT–CUSTOMER LINKS
-- ============================================================

-- Teachers linked to schools
INSERT INTO public.contact_customer_links (contact_id, customer_id, relationship_type, is_primary) VALUES
  ('10000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'TeacherAtSchool', true),
  ('10000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000001', 'TeacherAtSchool', false),
  ('10000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'TeacherAtSchool', true),
  ('10000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000002', 'TeacherAtSchool', false),
  ('10000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'TeacherAtSchool', true),
  ('10000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'TeacherAtSchool', true),
  ('10000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'TeacherAtSchool', true),
  ('10000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'TeacherAtSchool', true),
  ('10000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', 'TeacherAtSchool', true),
  ('10000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', 'TeacherAtSchool', true);

-- Buyers linked to companies
INSERT INTO public.contact_customer_links (contact_id, customer_id, relationship_type, is_primary) VALUES
  ('20000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'BuyerAtCompany', true),
  ('20000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'BuyerAtCompany', true),
  ('20000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'BuyerAtCompany', true),
  ('20000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000001', 'BuyerAtCompany', true),
  ('20000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000002', 'BuyerAtCompany', true);

-- Employees at companies
INSERT INTO public.contact_customer_links (contact_id, customer_id, relationship_type, is_primary) VALUES
  ('50000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', 'Employee', true),
  ('50000001-0000-0000-0000-000000000002', 'f0000001-0000-0000-0000-000000000002', 'Employee', true);

-- Private persons linked to private customers
INSERT INTO public.contact_customer_links (contact_id, customer_id, relationship_type, is_primary) VALUES
  ('30000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'PrimaryContact', true),
  ('30000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000002', 'PrimaryContact', true),
  ('30000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000003', 'PrimaryContact', true),
  ('30000001-0000-0000-0000-000000000004', 'e0000001-0000-0000-0000-000000000004', 'PrimaryContact', true);

-- ============================================================
-- 5. AGREEMENTS & ACCOUNTS
-- ============================================================
INSERT INTO public.agreements (id, name, description, is_active) VALUES
  ('aa000001-0000-0000-0000-000000000001', 'Skolavtal 2025', 'Ramavtal för grund- och gymnasieskolor med 15% rabatt på alla produkter', true),
  ('aa000001-0000-0000-0000-000000000002', 'Kommunavtal Stockholm', 'Årsavtal med Stockholms kommun, kvartalsvis fakturering', true),
  ('aa000001-0000-0000-0000-000000000003', 'Företagsavtal Standard', 'Standardavtal för företagskunder med 10% rabatt', true),
  ('aa000001-0000-0000-0000-000000000004', 'UF-Avtal 2025', 'Specialavtal för UF-företag med gratis frakt', true);

INSERT INTO public.accounts (id, name, customer_id, agreement_id, is_default) VALUES
  ('ab000001-0000-0000-0000-000000000001', 'Stockholms Slöjdskola — Huvudkonto', 'a0000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', true),
  ('ab000001-0000-0000-0000-000000000002', 'Göteborgs Montessoriskola — Huvudkonto', 'a0000001-0000-0000-0000-000000000002', 'aa000001-0000-0000-0000-000000000001', true),
  ('ab000001-0000-0000-0000-000000000003', 'Kreativa Verkstaden — Företagskonto', 'b0000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000003', true),
  ('ab000001-0000-0000-0000-000000000004', 'Stockholms Kommun — Utbildning', 'c0000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000002', true),
  ('ab000001-0000-0000-0000-000000000005', 'SlöjdKraft UF — Konto', 'f0000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000004', true);

-- ============================================================
-- 6. ORDERS
-- ============================================================
DELETE FROM public.orders;

INSERT INTO public.orders (id, order_number, customer_id, buyer_contact_id, account_id, total_amount, status, created_at) VALUES
  ('cc000001-0000-0000-0000-000000000001', 'ORD-000001', 'a0000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000001', 'ab000001-0000-0000-0000-000000000001', 4250.00, 'completed', now() - interval '3 days'),
  ('cc000001-0000-0000-0000-000000000002', 'ORD-000002', 'a0000001-0000-0000-0000-000000000002', '10000001-0000-0000-0000-000000000002', 'ab000001-0000-0000-0000-000000000002', 8790.00, 'completed', now() - interval '7 days'),
  ('cc000001-0000-0000-0000-000000000003', 'ORD-000003', 'a0000001-0000-0000-0000-000000000003', '10000001-0000-0000-0000-000000000003', NULL, 3150.50, 'completed', now() - interval '14 days'),
  ('cc000001-0000-0000-0000-000000000004', 'ORD-000004', 'b0000001-0000-0000-0000-000000000001', '20000001-0000-0000-0000-000000000001', 'ab000001-0000-0000-0000-000000000003', 12400.00, 'completed', now() - interval '5 days'),
  ('cc000001-0000-0000-0000-000000000005', 'ORD-000005', 'b0000001-0000-0000-0000-000000000002', '20000001-0000-0000-0000-000000000002', NULL, 6800.00, 'completed', now() - interval '21 days'),
  ('cc000001-0000-0000-0000-000000000006', 'ORD-000006', 'c0000001-0000-0000-0000-000000000001', '20000001-0000-0000-0000-000000000004', 'ab000001-0000-0000-0000-000000000004', 25600.00, 'completed', now() - interval '10 days'),
  ('cc000001-0000-0000-0000-000000000007', 'ORD-000007', 'e0000001-0000-0000-0000-000000000001', '30000001-0000-0000-0000-000000000001', NULL, 890.00, 'completed', now() - interval '2 days'),
  ('cc000001-0000-0000-0000-000000000008', 'ORD-000008', 'e0000001-0000-0000-0000-000000000002', '30000001-0000-0000-0000-000000000002', NULL, 1250.00, 'pending', now() - interval '1 day'),
  ('cc000001-0000-0000-0000-000000000009', 'ORD-000009', 'f0000001-0000-0000-0000-000000000001', '50000001-0000-0000-0000-000000000001', 'ab000001-0000-0000-0000-000000000005', 2100.00, 'completed', now() - interval '30 days'),
  ('cc000001-0000-0000-0000-000000000010', 'ORD-000010', 'a0000001-0000-0000-0000-000000000004', '10000001-0000-0000-0000-000000000004', NULL, 5680.00, 'completed', now() - interval '45 days'),
  ('cc000001-0000-0000-0000-000000000011', 'ORD-000011', 'a0000001-0000-0000-0000-000000000005', '10000001-0000-0000-0000-000000000005', NULL, 9450.00, 'completed', now() - interval '60 days'),
  ('cc000001-0000-0000-0000-000000000012', 'ORD-000012', 'a0000001-0000-0000-0000-000000000001', '10000001-0000-0000-0000-000000000001', 'ab000001-0000-0000-0000-000000000001', 3200.00, 'pending', now() - interval '12 hours'),
  ('cc000001-0000-0000-0000-000000000013', 'ORD-000013', 'b0000001-0000-0000-0000-000000000003', '20000001-0000-0000-0000-000000000003', NULL, 7800.00, 'completed', now() - interval '90 days'),
  ('cc000001-0000-0000-0000-000000000014', 'ORD-000014', 'c0000001-0000-0000-0000-000000000002', '20000001-0000-0000-0000-000000000005', NULL, 18900.00, 'completed', now() - interval '15 days'),
  ('cc000001-0000-0000-0000-000000000015', 'ORD-000015', 'a0000001-0000-0000-0000-000000000007', '10000001-0000-0000-0000-000000000007', NULL, 4100.00, 'completed', now() - interval '8 days');

-- ============================================================
-- 7. AUDIT LOGS (sample entries, using Stefan's user_id)
-- ============================================================
INSERT INTO public.audit_logs (actor_id, entity_type, entity_id, action, after_snapshot, created_at) VALUES
  ('eb599e3b-6020-45d3-a1ce-a97c9a4ee4c2', 'customer', 'a0000001-0000-0000-0000-000000000001', 'create', '{"name": "Stockholms Slöjdskola", "category": "Skola"}', now() - interval '30 days'),
  ('eb599e3b-6020-45d3-a1ce-a97c9a4ee4c2', 'customer', 'b0000001-0000-0000-0000-000000000001', 'create', '{"name": "Kreativa Verkstaden AB", "category": "Företag"}', now() - interval '28 days'),
  ('eb599e3b-6020-45d3-a1ce-a97c9a4ee4c2', 'contact', '10000001-0000-0000-0000-000000000001', 'create', '{"name": "Karin Andersson", "type": "Lärare"}', now() - interval '25 days'),
  ('eb599e3b-6020-45d3-a1ce-a97c9a4ee4c2', 'customer', 'a0000001-0000-0000-0000-000000000006', 'update', '{"is_active": false}', now() - interval '10 days'),
  ('eb599e3b-6020-45d3-a1ce-a97c9a4ee4c2', 'contact', '20000001-0000-0000-0000-000000000001', 'create', '{"name": "Sofia Lindqvist", "type": "Köpare"}', now() - interval '20 days'),
  ('eb599e3b-6020-45d3-a1ce-a97c9a4ee4c2', 'order', 'cc000001-0000-0000-0000-000000000006', 'create', '{"order_number": "ORD-000006", "total": 25600}', now() - interval '10 days'),
  ('eb599e3b-6020-45d3-a1ce-a97c9a4ee4c2', 'agreement', 'aa000001-0000-0000-0000-000000000001', 'create', '{"name": "Skolavtal 2025"}', now() - interval '35 days'),
  ('eb599e3b-6020-45d3-a1ce-a97c9a4ee4c2', 'customer', 'a0000001-0000-0000-0000-000000000001', 'update', '{"payer_customer_id": "c0000001-0000-0000-0000-000000000001"}', now() - interval '5 days');
