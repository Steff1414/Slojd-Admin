-- =============================================================================
-- Extended Dummy Data Seed
-- Adds more customers, contacts, schools, teachers, companies, addresses etc.
-- Safe to re-run: uses ON CONFLICT DO NOTHING and checks for existing data
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_extended_dummy_data()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  -- Kommun (payer) IDs
  v_uppsala_kommun UUID;
  v_linkoping_kommun UUID;
  v_lund_kommun UUID;
  v_norrkoping_kommun UUID;
  v_umea_kommun UUID;
  v_orebro_kommun UUID;
  v_vasteras_kommun UUID;
  v_helsingborg_kommun UUID;

  -- School IDs
  v_skola_fyrisskolan UUID;
  v_skola_katedralskolan UUID;
  v_skola_linneskolan UUID;
  v_skola_berga_skola UUID;
  v_skola_polhemskolan UUID;
  v_skola_vipeholmsskolan UUID;
  v_skola_klockaretorpsskolan UUID;
  v_skola_hagaskolan UUID;
  v_skola_dragonskolan UUID;
  v_skola_brickebackens UUID;
  v_skola_ronnbyskolan UUID;
  v_skola_olympiaskolan UUID;
  v_skola_slottsvangsskolan UUID;
  v_skola_drottning_blankas UUID;

  -- Company IDs
  v_foretag_kreativ UUID;
  v_foretag_konsthantverkarna UUID;
  v_foretag_slojdforeningen UUID;
  v_foretag_designtorget UUID;
  v_foretag_handarbetets_vanner UUID;
  v_foretag_hemslojden UUID;
  v_foretag_panduro UUID;
  v_foretag_clas_ohlson UUID;
  v_foretag_ikea_ab UUID;

  -- AF (Arbetsförmedling) IDs
  v_af_goteborg UUID;
  v_af_malmo UUID;

  -- UF (Ung Företagsamhet) IDs
  v_uf_stockholm UUID;
  v_uf_skane UUID;

  -- Omsorg IDs
  v_omsorg_solglanten UUID;
  v_omsorg_ekbacken UUID;

  -- Förening IDs
  v_forening_malarkraft UUID;
  v_forening_handslaget UUID;
  v_forening_slojdgillen UUID;

  -- Privat customer IDs
  v_privat_karlsson UUID;
  v_privat_johansson UUID;
  v_privat_nilsson UUID;
  v_privat_olsson UUID;
  v_privat_persson UUID;
  v_privat_svensson UUID;
  v_privat_gustafsson UUID;
  v_privat_pettersson UUID;
  v_privat_jonsson UUID;
  v_privat_lindberg UUID;
  v_privat_magnusson UUID;
  v_privat_larsson UUID;

  -- Contact IDs (teachers)
  v_teacher_maria UUID;
  v_teacher_anders UUID;
  v_teacher_karin UUID;
  v_teacher_thomas UUID;
  v_teacher_ingrid UUID;
  v_teacher_magnus UUID;
  v_teacher_cecilia UUID;
  v_teacher_henrik UUID;
  v_teacher_eva UUID;
  v_teacher_stefan UUID;
  v_teacher_birgitta UUID;
  v_teacher_per UUID;
  v_teacher_gunilla UUID;
  v_teacher_hans UUID;
  v_teacher_asa UUID;

  -- Contact IDs (members/buyers/others)
  v_contact_karl UUID;
  v_contact_maria_j UUID;
  v_contact_sven UUID;
  v_contact_inga UUID;
  v_contact_lars UUID;
  v_contact_greta UUID;
  v_contact_olof UUID;
  v_contact_astrid UUID;
  v_contact_nils UUID;
  v_contact_sigrid UUID;
  v_contact_gunnar UUID;
  v_contact_elsa UUID;
  v_contact_oscar UUID;
  v_contact_alma UUID;
  v_contact_viktor UUID;
  v_contact_frida UUID;
  v_contact_erik_b UUID;
  v_contact_linnea UUID;
  v_contact_axel UUID;
  v_contact_maja UUID;
  v_contact_hugo UUID;
  v_contact_ida UUID;
  v_contact_filip UUID;
  v_contact_wilma UUID;

  -- Agreement IDs
  v_agreement_skola UUID;
  v_agreement_kommun UUID;
  v_agreement_foretag UUID;

BEGIN

  -- =========================================================================
  -- 1. KOMMUNER (Payers / Municipalities)
  -- =========================================================================
  INSERT INTO customers (id, bc_customer_number, name, customer_category, customer_type_group, is_active)
  VALUES
    (gen_random_uuid(), 'KOMMUN-004', 'Uppsala kommun', 'Kommun och Region', 'B2G', true),
    (gen_random_uuid(), 'KOMMUN-005', 'Linköpings kommun', 'Kommun och Region', 'B2G', true),
    (gen_random_uuid(), 'KOMMUN-006', 'Lunds kommun', 'Kommun och Region', 'B2G', true),
    (gen_random_uuid(), 'KOMMUN-007', 'Norrköpings kommun', 'Kommun och Region', 'B2G', true),
    (gen_random_uuid(), 'KOMMUN-008', 'Umeå kommun', 'Kommun och Region', 'B2G', true),
    (gen_random_uuid(), 'KOMMUN-009', 'Örebro kommun', 'Kommun och Region', 'B2G', true),
    (gen_random_uuid(), 'KOMMUN-010', 'Västerås kommun', 'Kommun och Region', 'B2G', true),
    (gen_random_uuid(), 'KOMMUN-011', 'Helsingborgs kommun', 'Kommun och Region', 'B2G', true)
  ON CONFLICT (bc_customer_number) DO NOTHING;

  -- Fetch kommun IDs
  SELECT id INTO v_uppsala_kommun FROM customers WHERE bc_customer_number = 'KOMMUN-004';
  SELECT id INTO v_linkoping_kommun FROM customers WHERE bc_customer_number = 'KOMMUN-005';
  SELECT id INTO v_lund_kommun FROM customers WHERE bc_customer_number = 'KOMMUN-006';
  SELECT id INTO v_norrkoping_kommun FROM customers WHERE bc_customer_number = 'KOMMUN-007';
  SELECT id INTO v_umea_kommun FROM customers WHERE bc_customer_number = 'KOMMUN-008';
  SELECT id INTO v_orebro_kommun FROM customers WHERE bc_customer_number = 'KOMMUN-009';
  SELECT id INTO v_vasteras_kommun FROM customers WHERE bc_customer_number = 'KOMMUN-010';
  SELECT id INTO v_helsingborg_kommun FROM customers WHERE bc_customer_number = 'KOMMUN-011';

  -- =========================================================================
  -- 2. SKOLOR (Schools)
  -- =========================================================================
  INSERT INTO customers (id, bc_customer_number, name, customer_category, customer_type_group, payer_customer_id, is_active)
  VALUES
    -- Uppsala kommun schools
    (gen_random_uuid(), 'SKOLA-010', 'Fyrisskolan', 'Skola', 'B2G', v_uppsala_kommun, true),
    (gen_random_uuid(), 'SKOLA-011', 'Katedralskolan Uppsala', 'Skola', 'B2G', v_uppsala_kommun, true),
    -- Linköping kommun schools
    (gen_random_uuid(), 'SKOLA-012', 'Linnéskolan', 'Skola', 'B2G', v_linkoping_kommun, true),
    (gen_random_uuid(), 'SKOLA-013', 'Berga skola', 'Skola', 'B2G', v_linkoping_kommun, true),
    -- Lund kommun schools
    (gen_random_uuid(), 'SKOLA-014', 'Polhemskolan', 'Skola', 'B2G', v_lund_kommun, true),
    (gen_random_uuid(), 'SKOLA-015', 'Vipeholmsskolan', 'Skola', 'B2G', v_lund_kommun, true),
    -- Norrköping kommun schools
    (gen_random_uuid(), 'SKOLA-016', 'Klockaretorpsskolan', 'Skola', 'B2G', v_norrkoping_kommun, true),
    (gen_random_uuid(), 'SKOLA-017', 'Hagaskolan Norrköping', 'Skola', 'B2G', v_norrkoping_kommun, true),
    -- Umeå kommun schools
    (gen_random_uuid(), 'SKOLA-018', 'Dragonskolan', 'Skola', 'B2G', v_umea_kommun, true),
    -- Örebro kommun schools
    (gen_random_uuid(), 'SKOLA-019', 'Brickebackens skola', 'Skola', 'B2G', v_orebro_kommun, true),
    -- Västerås kommun schools
    (gen_random_uuid(), 'SKOLA-020', 'Rönnbyskolan', 'Skola', 'B2G', v_vasteras_kommun, true),
    (gen_random_uuid(), 'SKOLA-021', 'Olympiaskolan', 'Skola', 'B2G', v_vasteras_kommun, true),
    -- Helsingborg kommun schools
    (gen_random_uuid(), 'SKOLA-022', 'Slottsvångsskolan', 'Skola', 'B2G', v_helsingborg_kommun, true),
    (gen_random_uuid(), 'SKOLA-023', 'Drottning Blankas gymnasieskola', 'Skola', 'B2G', v_helsingborg_kommun, true)
  ON CONFLICT (bc_customer_number) DO NOTHING;

  -- Fetch school IDs
  SELECT id INTO v_skola_fyrisskolan FROM customers WHERE bc_customer_number = 'SKOLA-010';
  SELECT id INTO v_skola_katedralskolan FROM customers WHERE bc_customer_number = 'SKOLA-011';
  SELECT id INTO v_skola_linneskolan FROM customers WHERE bc_customer_number = 'SKOLA-012';
  SELECT id INTO v_skola_berga_skola FROM customers WHERE bc_customer_number = 'SKOLA-013';
  SELECT id INTO v_skola_polhemskolan FROM customers WHERE bc_customer_number = 'SKOLA-014';
  SELECT id INTO v_skola_vipeholmsskolan FROM customers WHERE bc_customer_number = 'SKOLA-015';
  SELECT id INTO v_skola_klockaretorpsskolan FROM customers WHERE bc_customer_number = 'SKOLA-016';
  SELECT id INTO v_skola_hagaskolan FROM customers WHERE bc_customer_number = 'SKOLA-017';
  SELECT id INTO v_skola_dragonskolan FROM customers WHERE bc_customer_number = 'SKOLA-018';
  SELECT id INTO v_skola_brickebackens FROM customers WHERE bc_customer_number = 'SKOLA-019';
  SELECT id INTO v_skola_ronnbyskolan FROM customers WHERE bc_customer_number = 'SKOLA-020';
  SELECT id INTO v_skola_olympiaskolan FROM customers WHERE bc_customer_number = 'SKOLA-021';
  SELECT id INTO v_skola_slottsvangsskolan FROM customers WHERE bc_customer_number = 'SKOLA-022';
  SELECT id INTO v_skola_drottning_blankas FROM customers WHERE bc_customer_number = 'SKOLA-023';

  -- =========================================================================
  -- 3. FÖRETAG (Companies - B2B)
  -- =========================================================================
  INSERT INTO customers (id, bc_customer_number, name, customer_category, customer_type_group, voyado_id, norce_code, is_active)
  VALUES
    (gen_random_uuid(), 'FTG-001', 'Kreativ Ateljé AB', 'Företag', 'B2B', 'voyado-ftg-001', 'NORCE-FTG-001', true),
    (gen_random_uuid(), 'FTG-002', 'Konsthantverkarna', 'Företag', 'B2B', 'voyado-ftg-002', 'NORCE-FTG-002', true),
    (gen_random_uuid(), 'FTG-003', 'Svenska Slöjdföreningen', 'Företag', 'B2B', 'voyado-ftg-003', NULL, true),
    (gen_random_uuid(), 'FTG-004', 'DesignTorget AB', 'Företag', 'B2B', 'voyado-ftg-004', 'NORCE-FTG-004', true),
    (gen_random_uuid(), 'FTG-005', 'Handarbetets Vänner', 'Företag', 'B2B', 'voyado-ftg-005', NULL, true),
    (gen_random_uuid(), 'FTG-006', 'Hemslöjden', 'Företag', 'B2B', 'voyado-ftg-006', 'NORCE-FTG-006', true),
    (gen_random_uuid(), 'FTG-007', 'Panduro Hobby AB', 'Företag', 'B2B', 'voyado-ftg-007', 'NORCE-FTG-007', true),
    (gen_random_uuid(), 'FTG-008', 'Clas Ohlson AB', 'Företag', 'B2B', 'voyado-ftg-008', 'NORCE-FTG-008', true),
    (gen_random_uuid(), 'FTG-009', 'IKEA of Sweden AB', 'Företag', 'B2B', 'voyado-ftg-009', 'NORCE-FTG-009', true)
  ON CONFLICT (bc_customer_number) DO NOTHING;

  SELECT id INTO v_foretag_kreativ FROM customers WHERE bc_customer_number = 'FTG-001';
  SELECT id INTO v_foretag_konsthantverkarna FROM customers WHERE bc_customer_number = 'FTG-002';
  SELECT id INTO v_foretag_slojdforeningen FROM customers WHERE bc_customer_number = 'FTG-003';
  SELECT id INTO v_foretag_designtorget FROM customers WHERE bc_customer_number = 'FTG-004';
  SELECT id INTO v_foretag_handarbetets_vanner FROM customers WHERE bc_customer_number = 'FTG-005';
  SELECT id INTO v_foretag_hemslojden FROM customers WHERE bc_customer_number = 'FTG-006';
  SELECT id INTO v_foretag_panduro FROM customers WHERE bc_customer_number = 'FTG-007';
  SELECT id INTO v_foretag_clas_ohlson FROM customers WHERE bc_customer_number = 'FTG-008';
  SELECT id INTO v_foretag_ikea_ab FROM customers WHERE bc_customer_number = 'FTG-009';

  -- =========================================================================
  -- 4. ÅF (Arbetsförmedling) & UF (Ung Företagsamhet)
  -- =========================================================================
  INSERT INTO customers (id, bc_customer_number, name, customer_category, customer_type_group, is_active)
  VALUES
    (gen_random_uuid(), 'AF-002', 'Arbetsförmedlingen Göteborg', 'ÅF', 'B2B', true),
    (gen_random_uuid(), 'AF-003', 'Arbetsförmedlingen Malmö', 'ÅF', 'B2B', true),
    (gen_random_uuid(), 'UF-001', 'Ung Företagsamhet Stockholm', 'UF', 'B2B', true),
    (gen_random_uuid(), 'UF-002', 'Ung Företagsamhet Skåne', 'UF', 'B2B', true)
  ON CONFLICT (bc_customer_number) DO NOTHING;

  SELECT id INTO v_af_goteborg FROM customers WHERE bc_customer_number = 'AF-002';
  SELECT id INTO v_af_malmo FROM customers WHERE bc_customer_number = 'AF-003';
  SELECT id INTO v_uf_stockholm FROM customers WHERE bc_customer_number = 'UF-001';
  SELECT id INTO v_uf_skane FROM customers WHERE bc_customer_number = 'UF-002';

  -- =========================================================================
  -- 5. OMSORG
  -- =========================================================================
  INSERT INTO customers (id, bc_customer_number, name, customer_category, customer_type_group, payer_customer_id, is_active)
  VALUES
    (gen_random_uuid(), 'OMSORG-001', 'Solgläntan daglig verksamhet', 'Omsorg', 'B2G', v_uppsala_kommun, true),
    (gen_random_uuid(), 'OMSORG-002', 'Ekbackens dagverksamhet', 'Omsorg', 'B2G', v_linkoping_kommun, true)
  ON CONFLICT (bc_customer_number) DO NOTHING;

  SELECT id INTO v_omsorg_solglanten FROM customers WHERE bc_customer_number = 'OMSORG-001';
  SELECT id INTO v_omsorg_ekbacken FROM customers WHERE bc_customer_number = 'OMSORG-002';

  -- =========================================================================
  -- 6. FÖRENINGAR
  -- =========================================================================
  INSERT INTO customers (id, bc_customer_number, name, customer_category, customer_type_group, is_active)
  VALUES
    (gen_random_uuid(), 'FOR-001', 'Mälarkraft Slöjdförening', 'Förening', 'B2B', true),
    (gen_random_uuid(), 'FOR-002', 'Handslaget Skåne', 'Förening', 'B2B', true),
    (gen_random_uuid(), 'FOR-003', 'Sveriges Slöjdgillen', 'Förening', 'B2B', true)
  ON CONFLICT (bc_customer_number) DO NOTHING;

  SELECT id INTO v_forening_malarkraft FROM customers WHERE bc_customer_number = 'FOR-001';
  SELECT id INTO v_forening_handslaget FROM customers WHERE bc_customer_number = 'FOR-002';
  SELECT id INTO v_forening_slojdgillen FROM customers WHERE bc_customer_number = 'FOR-003';

  -- =========================================================================
  -- 7. PRIVATKUNDER (B2C)
  -- =========================================================================
  INSERT INTO customers (id, bc_customer_number, name, customer_category, customer_type_group, voyado_id, is_active)
  VALUES
    (gen_random_uuid(), 'PRIVAT-003', 'Karl Karlsson', 'Privat', 'B2C', 'voyado-priv-003', true),
    (gen_random_uuid(), 'PRIVAT-004', 'Maria Johansson', 'Privat', 'B2C', 'voyado-priv-004', true),
    (gen_random_uuid(), 'PRIVAT-005', 'Sven Nilsson', 'Privat', 'B2C', 'voyado-priv-005', true),
    (gen_random_uuid(), 'PRIVAT-006', 'Inga Olsson', 'Privat', 'B2C', 'voyado-priv-006', true),
    (gen_random_uuid(), 'PRIVAT-007', 'Lars Persson', 'Privat', 'B2C', 'voyado-priv-007', true),
    (gen_random_uuid(), 'PRIVAT-008', 'Greta Svensson', 'Privat', 'B2C', 'voyado-priv-008', true),
    (gen_random_uuid(), 'PRIVAT-009', 'Olof Gustafsson', 'Privat', 'B2C', 'voyado-priv-009', true),
    (gen_random_uuid(), 'PRIVAT-010', 'Astrid Pettersson', 'Privat', 'B2C', 'voyado-priv-010', true),
    (gen_random_uuid(), 'PRIVAT-011', 'Nils Jonsson', 'Privat', 'B2C', 'voyado-priv-011', true),
    (gen_random_uuid(), 'PRIVAT-012', 'Sigrid Lindberg', 'Privat', 'B2C', 'voyado-priv-012', true),
    (gen_random_uuid(), 'PRIVAT-013', 'Gunnar Magnusson', 'Privat', 'B2C', 'voyado-priv-013', true),
    (gen_random_uuid(), 'PRIVAT-014', 'Elsa Larsson', 'Privat', 'B2C', 'voyado-priv-014', true)
  ON CONFLICT (bc_customer_number) DO NOTHING;

  SELECT id INTO v_privat_karlsson FROM customers WHERE bc_customer_number = 'PRIVAT-003';
  SELECT id INTO v_privat_johansson FROM customers WHERE bc_customer_number = 'PRIVAT-004';
  SELECT id INTO v_privat_nilsson FROM customers WHERE bc_customer_number = 'PRIVAT-005';
  SELECT id INTO v_privat_olsson FROM customers WHERE bc_customer_number = 'PRIVAT-006';
  SELECT id INTO v_privat_persson FROM customers WHERE bc_customer_number = 'PRIVAT-007';
  SELECT id INTO v_privat_svensson FROM customers WHERE bc_customer_number = 'PRIVAT-008';
  SELECT id INTO v_privat_gustafsson FROM customers WHERE bc_customer_number = 'PRIVAT-009';
  SELECT id INTO v_privat_pettersson FROM customers WHERE bc_customer_number = 'PRIVAT-010';
  SELECT id INTO v_privat_jonsson FROM customers WHERE bc_customer_number = 'PRIVAT-011';
  SELECT id INTO v_privat_lindberg FROM customers WHERE bc_customer_number = 'PRIVAT-012';
  SELECT id INTO v_privat_magnusson FROM customers WHERE bc_customer_number = 'PRIVAT-013';
  SELECT id INTO v_privat_larsson FROM customers WHERE bc_customer_number = 'PRIVAT-014';

  -- =========================================================================
  -- 8. CONTACTS - Teachers
  -- =========================================================================
  INSERT INTO contacts (id, voyado_id, first_name, last_name, email, phone, contact_type, is_teacher, wants_sms, wants_newsletter, wants_personalized_offers)
  VALUES
    (gen_random_uuid(), 'voyado-teacher-010', 'Maria', 'Engström', 'maria.engstrom@edu.uppsala.se', '+46701234580', 'Lärare', true, false, true, false),
    (gen_random_uuid(), 'voyado-teacher-011', 'Anders', 'Björk', 'anders.bjork@edu.uppsala.se', '+46702345681', 'Lärare', true, true, true, false),
    (gen_random_uuid(), 'voyado-teacher-012', 'Karin', 'Hedlund', 'karin.hedlund@edu.linkoping.se', '+46703456782', 'Lärare', true, false, false, false),
    (gen_random_uuid(), 'voyado-teacher-013', 'Thomas', 'Wikström', 'thomas.wikstrom@edu.linkoping.se', '+46704567883', 'Lärare', true, false, true, false),
    (gen_random_uuid(), 'voyado-teacher-014', 'Ingrid', 'Holm', 'ingrid.holm@edu.lund.se', '+46705678984', 'Lärare', true, true, true, true),
    (gen_random_uuid(), 'voyado-teacher-015', 'Magnus', 'Sjögren', 'magnus.sjogren@edu.lund.se', '+46706789085', 'Lärare', true, false, false, false),
    (gen_random_uuid(), 'voyado-teacher-016', 'Cecilia', 'Wallin', 'cecilia.wallin@edu.norrkoping.se', '+46707890186', 'Lärare', true, true, true, false),
    (gen_random_uuid(), 'voyado-teacher-017', 'Henrik', 'Nordström', 'henrik.nordstrom@edu.norrkoping.se', '+46708901287', 'Lärare', true, false, true, false),
    (gen_random_uuid(), 'voyado-teacher-018', 'Eva', 'Bergqvist', 'eva.bergqvist@edu.umea.se', '+46709012388', 'Lärare', true, true, false, true),
    (gen_random_uuid(), 'voyado-teacher-019', 'Stefan', 'Åberg', 'stefan.aberg@edu.orebro.se', '+46700123489', 'Lärare', true, false, true, false),
    (gen_random_uuid(), 'voyado-teacher-020', 'Birgitta', 'Ekman', 'birgitta.ekman@edu.vasteras.se', '+46701234590', 'Lärare', true, true, true, true),
    (gen_random_uuid(), 'voyado-teacher-021', 'Per', 'Sandberg', 'per.sandberg@edu.vasteras.se', '+46702345691', 'Lärare', true, false, false, false),
    (gen_random_uuid(), 'voyado-teacher-022', 'Gunilla', 'Öberg', 'gunilla.oberg@edu.helsingborg.se', '+46703456792', 'Lärare', true, false, true, false),
    (gen_random_uuid(), 'voyado-teacher-023', 'Hans', 'Fransson', 'hans.fransson@edu.helsingborg.se', '+46704567893', 'Lärare', true, true, true, false),
    (gen_random_uuid(), 'voyado-teacher-024', 'Åsa', 'Lundgren', 'asa.lundgren@edu.linkoping.se', '+46705678994', 'Lärare', true, false, true, true)
  ON CONFLICT (voyado_id) DO NOTHING;

  -- Fetch teacher contact IDs
  SELECT id INTO v_teacher_maria FROM contacts WHERE voyado_id = 'voyado-teacher-010';
  SELECT id INTO v_teacher_anders FROM contacts WHERE voyado_id = 'voyado-teacher-011';
  SELECT id INTO v_teacher_karin FROM contacts WHERE voyado_id = 'voyado-teacher-012';
  SELECT id INTO v_teacher_thomas FROM contacts WHERE voyado_id = 'voyado-teacher-013';
  SELECT id INTO v_teacher_ingrid FROM contacts WHERE voyado_id = 'voyado-teacher-014';
  SELECT id INTO v_teacher_magnus FROM contacts WHERE voyado_id = 'voyado-teacher-015';
  SELECT id INTO v_teacher_cecilia FROM contacts WHERE voyado_id = 'voyado-teacher-016';
  SELECT id INTO v_teacher_henrik FROM contacts WHERE voyado_id = 'voyado-teacher-017';
  SELECT id INTO v_teacher_eva FROM contacts WHERE voyado_id = 'voyado-teacher-018';
  SELECT id INTO v_teacher_stefan FROM contacts WHERE voyado_id = 'voyado-teacher-019';
  SELECT id INTO v_teacher_birgitta FROM contacts WHERE voyado_id = 'voyado-teacher-020';
  SELECT id INTO v_teacher_per FROM contacts WHERE voyado_id = 'voyado-teacher-021';
  SELECT id INTO v_teacher_gunilla FROM contacts WHERE voyado_id = 'voyado-teacher-022';
  SELECT id INTO v_teacher_hans FROM contacts WHERE voyado_id = 'voyado-teacher-023';
  SELECT id INTO v_teacher_asa FROM contacts WHERE voyado_id = 'voyado-teacher-024';

  -- =========================================================================
  -- 9. CONTACTS - Members, Buyers, Privatpersoner, Others
  -- =========================================================================
  INSERT INTO contacts (id, voyado_id, first_name, last_name, email, phone, contact_type, is_teacher, wants_sms, wants_newsletter, wants_personalized_offers)
  VALUES
    -- Medlemmar (Members)
    (gen_random_uuid(), 'voyado-member-010', 'Karl', 'Karlsson', 'karl.karlsson@gmail.com', '+46701111001', 'Medlem', false, true, true, true),
    (gen_random_uuid(), 'voyado-member-011', 'Maria', 'Johansson', 'maria.johansson@hotmail.com', '+46701111002', 'Medlem', false, true, true, true),
    (gen_random_uuid(), 'voyado-member-012', 'Sven', 'Nilsson', 'sven.nilsson@yahoo.se', '+46701111003', 'Medlem', false, false, true, false),
    (gen_random_uuid(), 'voyado-member-013', 'Inga', 'Olsson', 'inga.olsson@telia.se', '+46701111004', 'Medlem', false, true, false, true),
    (gen_random_uuid(), 'voyado-member-014', 'Lars', 'Persson', 'lars.persson@outlook.com', '+46701111005', 'Medlem', false, false, true, true),
    (gen_random_uuid(), 'voyado-member-015', 'Greta', 'Svensson', 'greta.svensson@gmail.com', '+46701111006', 'Medlem', false, true, true, false),
    -- Köpare (Buyers)
    (gen_random_uuid(), 'voyado-buyer-010', 'Olof', 'Gustafsson', 'olof.gustafsson@kreativatelje.se', '+46702222001', 'Köpare', false, false, false, true),
    (gen_random_uuid(), 'voyado-buyer-011', 'Astrid', 'Pettersson', 'astrid.pettersson@designtorget.se', '+46702222002', 'Köpare', false, true, true, true),
    (gen_random_uuid(), 'voyado-buyer-012', 'Nils', 'Jonsson', 'nils.jonsson@panduro.se', '+46702222003', 'Köpare', false, false, true, false),
    (gen_random_uuid(), 'voyado-buyer-013', 'Sigrid', 'Lindberg', 'sigrid.lindberg@hemslojden.org', '+46702222004', 'Köpare', false, true, false, true),
    -- Privatpersoner
    (gen_random_uuid(), 'voyado-privat-010', 'Gunnar', 'Magnusson', 'gunnar.magnusson@gmail.com', '+46703333001', 'Privatperson', false, false, false, false),
    (gen_random_uuid(), 'voyado-privat-011', 'Elsa', 'Larsson', 'elsa.larsson@icloud.com', '+46703333002', 'Privatperson', false, true, true, true),
    (gen_random_uuid(), 'voyado-privat-012', 'Oscar', 'Ek', 'oscar.ek@protonmail.com', '+46703333003', 'Privatperson', false, false, true, false),
    (gen_random_uuid(), 'voyado-privat-013', 'Alma', 'Lindqvist', 'alma.lindqvist@live.se', '+46703333004', 'Privatperson', false, true, true, true),
    (gen_random_uuid(), 'voyado-privat-014', 'Viktor', 'Ström', 'viktor.strom@gmail.com', '+46703333005', 'Privatperson', false, false, false, true),
    (gen_random_uuid(), 'voyado-privat-015', 'Frida', 'Berg', 'frida.berg@outlook.se', '+46703333006', 'Privatperson', false, true, true, false),
    -- Nyhetsbrev
    (gen_random_uuid(), 'voyado-news-001', 'Erik', 'Blom', 'erik.blom@craft.se', '+46704444001', 'Nyhetsbrev', false, false, false, false),
    (gen_random_uuid(), 'voyado-news-002', 'Linnea', 'Dahlgren', 'linnea.dahlgren@gmail.com', '+46704444002', 'Nyhetsbrev', false, false, true, false),
    -- Övriga
    (gen_random_uuid(), 'voyado-other-001', 'Axel', 'Holmberg', 'axel.holmberg@clasohlson.se', '+46705555001', 'Övrig', false, false, false, false),
    (gen_random_uuid(), 'voyado-other-002', 'Maja', 'Forsell', 'maja.forsell@ikea.com', '+46705555002', 'Övrig', false, true, false, false),
    (gen_random_uuid(), 'voyado-other-003', 'Hugo', 'Vestlund', 'hugo.vestlund@af.se', '+46705555003', 'Övrig', false, false, true, false),
    (gen_random_uuid(), 'voyado-other-004', 'Ida', 'Nyström', 'ida.nystrom@uf.se', '+46705555004', 'Övrig', false, false, false, false),
    (gen_random_uuid(), 'voyado-other-005', 'Filip', 'Ahlström', 'filip.ahlstrom@slojdgillen.se', '+46705555005', 'Övrig', false, true, true, false),
    (gen_random_uuid(), 'voyado-other-006', 'Wilma', 'Ekström', 'wilma.ekstrom@handslaget.se', '+46705555006', 'Övrig', false, false, false, false)
  ON CONFLICT (voyado_id) DO NOTHING;

  -- Fetch contact IDs
  SELECT id INTO v_contact_karl FROM contacts WHERE voyado_id = 'voyado-member-010';
  SELECT id INTO v_contact_maria_j FROM contacts WHERE voyado_id = 'voyado-member-011';
  SELECT id INTO v_contact_sven FROM contacts WHERE voyado_id = 'voyado-member-012';
  SELECT id INTO v_contact_inga FROM contacts WHERE voyado_id = 'voyado-member-013';
  SELECT id INTO v_contact_lars FROM contacts WHERE voyado_id = 'voyado-member-014';
  SELECT id INTO v_contact_greta FROM contacts WHERE voyado_id = 'voyado-member-015';
  SELECT id INTO v_contact_olof FROM contacts WHERE voyado_id = 'voyado-buyer-010';
  SELECT id INTO v_contact_astrid FROM contacts WHERE voyado_id = 'voyado-buyer-011';
  SELECT id INTO v_contact_nils FROM contacts WHERE voyado_id = 'voyado-buyer-012';
  SELECT id INTO v_contact_sigrid FROM contacts WHERE voyado_id = 'voyado-buyer-013';
  SELECT id INTO v_contact_gunnar FROM contacts WHERE voyado_id = 'voyado-privat-010';
  SELECT id INTO v_contact_elsa FROM contacts WHERE voyado_id = 'voyado-privat-011';
  SELECT id INTO v_contact_oscar FROM contacts WHERE voyado_id = 'voyado-privat-012';
  SELECT id INTO v_contact_alma FROM contacts WHERE voyado_id = 'voyado-privat-013';
  SELECT id INTO v_contact_viktor FROM contacts WHERE voyado_id = 'voyado-privat-014';
  SELECT id INTO v_contact_frida FROM contacts WHERE voyado_id = 'voyado-privat-015';
  SELECT id INTO v_contact_erik_b FROM contacts WHERE voyado_id = 'voyado-news-001';
  SELECT id INTO v_contact_linnea FROM contacts WHERE voyado_id = 'voyado-news-002';
  SELECT id INTO v_contact_axel FROM contacts WHERE voyado_id = 'voyado-other-001';
  SELECT id INTO v_contact_maja FROM contacts WHERE voyado_id = 'voyado-other-002';
  SELECT id INTO v_contact_hugo FROM contacts WHERE voyado_id = 'voyado-other-003';
  SELECT id INTO v_contact_ida FROM contacts WHERE voyado_id = 'voyado-other-004';
  SELECT id INTO v_contact_filip FROM contacts WHERE voyado_id = 'voyado-other-005';
  SELECT id INTO v_contact_wilma FROM contacts WHERE voyado_id = 'voyado-other-006';

  -- =========================================================================
  -- 10. TEACHER-SCHOOL ASSIGNMENTS
  -- =========================================================================
  -- Each teacher can teach at 1-2 schools
  INSERT INTO teacher_school_assignments (teacher_contact_id, school_customer_id, role, is_active)
  VALUES
    -- Maria Engström @ Uppsala
    (v_teacher_maria, v_skola_fyrisskolan, 'Slöjdlärare', true),
    (v_teacher_maria, v_skola_katedralskolan, 'Träslöjdslärare', true),
    -- Anders Björk @ Uppsala
    (v_teacher_anders, v_skola_katedralskolan, 'Textillärare', true),
    -- Karin Hedlund @ Linköping
    (v_teacher_karin, v_skola_linneskolan, 'Slöjdlärare', true),
    -- Thomas Wikström @ Linköping
    (v_teacher_thomas, v_skola_linneskolan, 'Metallslöjdslärare', true),
    (v_teacher_thomas, v_skola_berga_skola, 'Slöjdlärare', true),
    -- Ingrid Holm @ Lund
    (v_teacher_ingrid, v_skola_polhemskolan, 'Slöjdlärare', true),
    -- Magnus Sjögren @ Lund
    (v_teacher_magnus, v_skola_vipeholmsskolan, 'Träslöjdslärare', true),
    (v_teacher_magnus, v_skola_polhemskolan, 'Bildlärare', true),
    -- Cecilia Wallin @ Norrköping
    (v_teacher_cecilia, v_skola_klockaretorpsskolan, 'Slöjdlärare', true),
    -- Henrik Nordström @ Norrköping
    (v_teacher_henrik, v_skola_hagaskolan, 'Träslöjdslärare', true),
    (v_teacher_henrik, v_skola_klockaretorpsskolan, 'Metallslöjdslärare', true),
    -- Eva Bergqvist @ Umeå
    (v_teacher_eva, v_skola_dragonskolan, 'Slöjdlärare', true),
    -- Stefan Åberg @ Örebro
    (v_teacher_stefan, v_skola_brickebackens, 'Slöjdlärare', true),
    -- Birgitta Ekman @ Västerås
    (v_teacher_birgitta, v_skola_ronnbyskolan, 'Slöjdlärare', true),
    (v_teacher_birgitta, v_skola_olympiaskolan, 'Textillärare', true),
    -- Per Sandberg @ Västerås
    (v_teacher_per, v_skola_olympiaskolan, 'Träslöjdslärare', true),
    -- Gunilla Öberg @ Helsingborg
    (v_teacher_gunilla, v_skola_slottsvangsskolan, 'Slöjdlärare', true),
    -- Hans Fransson @ Helsingborg
    (v_teacher_hans, v_skola_drottning_blankas, 'Slöjdlärare', true),
    (v_teacher_hans, v_skola_slottsvangsskolan, 'Bildlärare', true),
    -- Åsa Lundgren @ Linköping
    (v_teacher_asa, v_skola_berga_skola, 'Textillärare', true)
  ON CONFLICT (teacher_contact_id, school_customer_id) DO NOTHING;

  -- =========================================================================
  -- 11. CONTACT-CUSTOMER LINKS
  -- =========================================================================
  -- Teachers at their schools
  INSERT INTO contact_customer_links (contact_id, customer_id, relationship_type, is_primary)
  VALUES
    (v_teacher_maria, v_skola_fyrisskolan, 'TeacherAtSchool', true),
    (v_teacher_maria, v_skola_katedralskolan, 'TeacherAtSchool', false),
    (v_teacher_anders, v_skola_katedralskolan, 'TeacherAtSchool', true),
    (v_teacher_karin, v_skola_linneskolan, 'TeacherAtSchool', true),
    (v_teacher_thomas, v_skola_linneskolan, 'TeacherAtSchool', false),
    (v_teacher_thomas, v_skola_berga_skola, 'TeacherAtSchool', true),
    (v_teacher_ingrid, v_skola_polhemskolan, 'TeacherAtSchool', true),
    (v_teacher_magnus, v_skola_vipeholmsskolan, 'TeacherAtSchool', true),
    (v_teacher_magnus, v_skola_polhemskolan, 'TeacherAtSchool', false),
    (v_teacher_cecilia, v_skola_klockaretorpsskolan, 'TeacherAtSchool', true),
    (v_teacher_henrik, v_skola_hagaskolan, 'TeacherAtSchool', true),
    (v_teacher_henrik, v_skola_klockaretorpsskolan, 'TeacherAtSchool', false),
    (v_teacher_eva, v_skola_dragonskolan, 'TeacherAtSchool', true),
    (v_teacher_stefan, v_skola_brickebackens, 'TeacherAtSchool', true),
    (v_teacher_birgitta, v_skola_ronnbyskolan, 'TeacherAtSchool', true),
    (v_teacher_birgitta, v_skola_olympiaskolan, 'TeacherAtSchool', false),
    (v_teacher_per, v_skola_olympiaskolan, 'TeacherAtSchool', true),
    (v_teacher_gunilla, v_skola_slottsvangsskolan, 'TeacherAtSchool', true),
    (v_teacher_hans, v_skola_drottning_blankas, 'TeacherAtSchool', true),
    (v_teacher_hans, v_skola_slottsvangsskolan, 'TeacherAtSchool', false),
    (v_teacher_asa, v_skola_berga_skola, 'TeacherAtSchool', false)
  ON CONFLICT (contact_id, customer_id, relationship_type) DO NOTHING;

  -- Buyers at companies
  INSERT INTO contact_customer_links (contact_id, customer_id, relationship_type, is_primary)
  VALUES
    (v_contact_olof, v_foretag_kreativ, 'BuyerAtCompany', true),
    (v_contact_astrid, v_foretag_designtorget, 'BuyerAtCompany', true),
    (v_contact_nils, v_foretag_panduro, 'BuyerAtCompany', true),
    (v_contact_sigrid, v_foretag_hemslojden, 'BuyerAtCompany', true),
    (v_contact_axel, v_foretag_clas_ohlson, 'Employee', true),
    (v_contact_maja, v_foretag_ikea_ab, 'Employee', true)
  ON CONFLICT (contact_id, customer_id, relationship_type) DO NOTHING;

  -- Members linked to privat customers
  INSERT INTO contact_customer_links (contact_id, customer_id, relationship_type, is_primary)
  VALUES
    (v_contact_karl, v_privat_karlsson, 'PrimaryContact', true),
    (v_contact_maria_j, v_privat_johansson, 'PrimaryContact', true),
    (v_contact_sven, v_privat_nilsson, 'PrimaryContact', true),
    (v_contact_inga, v_privat_olsson, 'PrimaryContact', true),
    (v_contact_lars, v_privat_persson, 'PrimaryContact', true),
    (v_contact_greta, v_privat_svensson, 'PrimaryContact', true),
    (v_contact_gunnar, v_privat_magnusson, 'PrimaryContact', true),
    (v_contact_elsa, v_privat_larsson, 'PrimaryContact', true)
  ON CONFLICT (contact_id, customer_id, relationship_type) DO NOTHING;

  -- Contacts at other orgs
  INSERT INTO contact_customer_links (contact_id, customer_id, relationship_type, is_primary)
  VALUES
    (v_contact_hugo, v_af_goteborg, 'Employee', true),
    (v_contact_ida, v_uf_stockholm, 'Employee', true),
    (v_contact_filip, v_forening_slojdgillen, 'PrimaryContact', true),
    (v_contact_wilma, v_forening_handslaget, 'PrimaryContact', true),
    (v_contact_erik_b, v_foretag_konsthantverkarna, 'Employee', true),
    (v_contact_linnea, v_foretag_handarbetets_vanner, 'Employee', true)
  ON CONFLICT (contact_id, customer_id, relationship_type) DO NOTHING;

  -- =========================================================================
  -- 12. CUSTOMER ADDRESSES
  -- =========================================================================
  -- Kommuner
  INSERT INTO customer_addresses (customer_id, address_type, street, postal_code, city, region, country, is_default_for_type)
  VALUES
    (v_uppsala_kommun, 'BILLING', 'Stadshusgatan 2', '753 21', 'Uppsala', 'Uppsala län', 'SE', true),
    (v_linkoping_kommun, 'BILLING', 'Storgatan 43', '581 83', 'Linköping', 'Östergötlands län', 'SE', true),
    (v_lund_kommun, 'BILLING', 'Bruksgatan 22', '222 36', 'Lund', 'Skåne län', 'SE', true),
    (v_norrkoping_kommun, 'BILLING', 'De Geersgatan 8', '602 27', 'Norrköping', 'Östergötlands län', 'SE', true),
    (v_umea_kommun, 'BILLING', 'Skolgatan 31A', '901 84', 'Umeå', 'Västerbottens län', 'SE', true),
    (v_orebro_kommun, 'BILLING', 'Drottninggatan 9', '701 35', 'Örebro', 'Örebro län', 'SE', true),
    (v_vasteras_kommun, 'BILLING', 'Stadshuset Fiskartorgsgatan 1', '721 87', 'Västerås', 'Västmanlands län', 'SE', true),
    (v_helsingborg_kommun, 'BILLING', 'Stortorget 17', '251 89', 'Helsingborg', 'Skåne län', 'SE', true)
  ON CONFLICT DO NOTHING;

  -- Schools with both billing (via kommun) and delivery addresses
  INSERT INTO customer_addresses (customer_id, address_type, street, postal_code, city, region, country, is_default_for_type, name)
  VALUES
    (v_skola_fyrisskolan, 'DELIVERY', 'Fyrisvallsgatan 12', '754 50', 'Uppsala', 'Uppsala län', 'SE', true, 'Fyrisskolan'),
    (v_skola_katedralskolan, 'DELIVERY', 'Skolgatan 2', '753 12', 'Uppsala', 'Uppsala län', 'SE', true, 'Katedralskolan Uppsala'),
    (v_skola_linneskolan, 'DELIVERY', 'Rydsvägen 230', '582 58', 'Linköping', 'Östergötlands län', 'SE', true, 'Linnéskolan'),
    (v_skola_berga_skola, 'DELIVERY', 'Södra Bergsvägen 4', '585 98', 'Linköping', 'Östergötlands län', 'SE', true, 'Berga skola'),
    (v_skola_polhemskolan, 'DELIVERY', 'Dalbyvägen 40', '224 60', 'Lund', 'Skåne län', 'SE', true, 'Polhemskolan'),
    (v_skola_vipeholmsskolan, 'DELIVERY', 'Vipevägen 2', '225 93', 'Lund', 'Skåne län', 'SE', true, 'Vipeholmsskolan'),
    (v_skola_klockaretorpsskolan, 'DELIVERY', 'Bruksvägen 6', '603 71', 'Norrköping', 'Östergötlands län', 'SE', true, 'Klockaretorpsskolan'),
    (v_skola_hagaskolan, 'DELIVERY', 'Hagatorg 4', '603 53', 'Norrköping', 'Östergötlands län', 'SE', true, 'Hagaskolan'),
    (v_skola_dragonskolan, 'DELIVERY', 'Ridvägen 1', '907 36', 'Umeå', 'Västerbottens län', 'SE', true, 'Dragonskolan'),
    (v_skola_brickebackens, 'DELIVERY', 'Brickebacksvägen 3', '702 38', 'Örebro', 'Örebro län', 'SE', true, 'Brickebackens skola'),
    (v_skola_ronnbyskolan, 'DELIVERY', 'Rönnbyvägen 10', '724 72', 'Västerås', 'Västmanlands län', 'SE', true, 'Rönnbyskolan'),
    (v_skola_olympiaskolan, 'DELIVERY', 'Industrigatan 5', '722 25', 'Västerås', 'Västmanlands län', 'SE', true, 'Olympiaskolan'),
    (v_skola_slottsvangsskolan, 'DELIVERY', 'Slottsvångsvägen 8', '254 52', 'Helsingborg', 'Skåne län', 'SE', true, 'Slottsvångsskolan'),
    (v_skola_drottning_blankas, 'DELIVERY', 'Drottninggatan 15', '252 21', 'Helsingborg', 'Skåne län', 'SE', true, 'Drottning Blankas gymnasieskola')
  ON CONFLICT DO NOTHING;

  -- Company addresses
  INSERT INTO customer_addresses (customer_id, address_type, street, postal_code, city, region, country, is_default_for_type, name)
  VALUES
    (v_foretag_kreativ, 'BILLING', 'Ateljévägen 5', '112 44', 'Stockholm', 'Stockholms län', 'SE', true, 'Kreativ Ateljé AB'),
    (v_foretag_kreativ, 'DELIVERY', 'Ateljévägen 5', '112 44', 'Stockholm', 'Stockholms län', 'SE', true, 'Kreativ Ateljé AB'),
    (v_foretag_konsthantverkarna, 'BILLING', 'Södermalmstorg 4', '116 45', 'Stockholm', 'Stockholms län', 'SE', true, 'Konsthantverkarna'),
    (v_foretag_designtorget, 'BILLING', 'Götgatan 31', '116 21', 'Stockholm', 'Stockholms län', 'SE', true, 'DesignTorget AB'),
    (v_foretag_designtorget, 'DELIVERY', 'Lagervägen 12', '125 30', 'Älvsjö', 'Stockholms län', 'SE', true, 'DesignTorget Lager'),
    (v_foretag_panduro, 'BILLING', 'Argongatan 2B', '431 53', 'Mölndal', 'Västra Götalands län', 'SE', true, 'Panduro Hobby AB'),
    (v_foretag_panduro, 'DELIVERY', 'Argongatan 2B', '431 53', 'Mölndal', 'Västra Götalands län', 'SE', true, 'Panduro Lager'),
    (v_foretag_hemslojden, 'BILLING', 'Nybrogatan 20', '114 39', 'Stockholm', 'Stockholms län', 'SE', true, 'Hemslöjden'),
    (v_foretag_clas_ohlson, 'BILLING', 'Norra Stationsgatan 80', '113 64', 'Stockholm', 'Stockholms län', 'SE', true, 'Clas Ohlson AB'),
    (v_foretag_ikea_ab, 'BILLING', 'Modulvägen 1', '343 81', 'Älmhult', 'Kronobergs län', 'SE', true, 'IKEA of Sweden AB')
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- 13. AGREEMENTS
  -- =========================================================================
  INSERT INTO agreements (id, name, description, is_active)
  VALUES
    (gen_random_uuid(), 'Skolavtal Standard', 'Standardavtal för kommunala skolor med 15% rabatt på allt slöjdmaterial', true),
    (gen_random_uuid(), 'Kommunavtal Premium', 'Premiumavtal för hela kommunen - fri frakt och 20% rabatt', true),
    (gen_random_uuid(), 'Företagsavtal Återsäljare', 'Avtal för återförsäljare med 30% på RRP', true)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_agreement_skola FROM agreements WHERE name = 'Skolavtal Standard';
  SELECT id INTO v_agreement_kommun FROM agreements WHERE name = 'Kommunavtal Premium';
  SELECT id INTO v_agreement_foretag FROM agreements WHERE name = 'Företagsavtal Återsäljare';

  -- =========================================================================
  -- 14. ACCOUNTS
  -- =========================================================================
  -- Kommun accounts
  INSERT INTO accounts (name, customer_id, agreement_id, is_default)
  VALUES
    ('Uppsala kommun - Huvudkonto', v_uppsala_kommun, v_agreement_kommun, true),
    ('Linköpings kommun - Huvudkonto', v_linkoping_kommun, v_agreement_kommun, true),
    ('Lunds kommun - Huvudkonto', v_lund_kommun, v_agreement_kommun, true),
    ('Norrköpings kommun - Huvudkonto', v_norrkoping_kommun, v_agreement_kommun, true),
    ('Umeå kommun - Huvudkonto', v_umea_kommun, v_agreement_kommun, true),
    ('Örebro kommun - Huvudkonto', v_orebro_kommun, v_agreement_kommun, true),
    ('Västerås kommun - Huvudkonto', v_vasteras_kommun, v_agreement_kommun, true),
    ('Helsingborgs kommun - Huvudkonto', v_helsingborg_kommun, v_agreement_kommun, true)
  ON CONFLICT DO NOTHING;

  -- School accounts
  INSERT INTO accounts (name, customer_id, agreement_id, is_default)
  VALUES
    ('Fyrisskolan - Slöjd', v_skola_fyrisskolan, v_agreement_skola, true),
    ('Katedralskolan Uppsala - Slöjd', v_skola_katedralskolan, v_agreement_skola, true),
    ('Linnéskolan - Slöjd', v_skola_linneskolan, v_agreement_skola, true),
    ('Polhemskolan - Slöjd', v_skola_polhemskolan, v_agreement_skola, true),
    ('Dragonskolan - Slöjd', v_skola_dragonskolan, v_agreement_skola, true),
    ('Rönnbyskolan - Slöjd', v_skola_ronnbyskolan, v_agreement_skola, true),
    ('Slottsvångsskolan - Slöjd', v_skola_slottsvangsskolan, v_agreement_skola, true)
  ON CONFLICT DO NOTHING;

  -- Company accounts
  INSERT INTO accounts (name, customer_id, agreement_id, is_default)
  VALUES
    ('Kreativ Ateljé AB - Inköp', v_foretag_kreativ, NULL, true),
    ('DesignTorget AB - Återförsäljare', v_foretag_designtorget, v_agreement_foretag, true),
    ('Panduro Hobby AB - Återförsäljare', v_foretag_panduro, v_agreement_foretag, true),
    ('Hemslöjden - Inköp', v_foretag_hemslojden, NULL, true),
    ('Clas Ohlson AB - B2B', v_foretag_clas_ohlson, v_agreement_foretag, true),
    ('IKEA of Sweden AB - Inköp', v_foretag_ikea_ab, NULL, true)
  ON CONFLICT DO NOTHING;

  -- =========================================================================
  -- 15. ORDERS (mix of school and company orders)
  -- =========================================================================
  DECLARE
    v_order_id UUID;
    v_order_counter INT := 2000;
  BEGIN
    -- Teacher orders for schools
    -- Maria Engström buying for Fyrisskolan
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'SCH-' || LPAD(v_order_counter::TEXT, 6, '0'), v_skola_fyrisskolan, v_teacher_maria, 4850.00, 'completed', NOW() - INTERVAL '45 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-101', 'Klassrumsset Träslöjd', 'Träslöjd', 'Trä & metall', 5, 489.00, 2445.00),
        (v_order_id, 'PROD-102', 'Sågblad Sortiment', 'Handverktyg', 'Trä & metall', 10, 45.00, 450.00),
        (v_order_id, 'PROD-103', 'Sandpapper Blandade Korn', 'Slipprodukter', 'Trä & metall', 20, 29.00, 580.00),
        (v_order_id, 'PROD-104', 'Björkplywood 4mm', 'Trämaterial', 'Trä & metall', 25, 55.00, 1375.00);
    END IF;
    v_order_counter := v_order_counter + 1;

    -- Karin Hedlund buying for Linnéskolan
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'SCH-' || LPAD(v_order_counter::TEXT, 6, '0'), v_skola_linneskolan, v_teacher_karin, 3200.00, 'completed', NOW() - INTERVAL '30 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-201', 'Akrylfärg Skolpaket 12st', 'Färg', 'Teckna & måla', 8, 249.00, 1992.00),
        (v_order_id, 'PROD-202', 'Penslar Skolset', 'Penslar', 'Teckna & måla', 15, 49.00, 735.00),
        (v_order_id, 'PROD-203', 'Ritblock A3 100 ark', 'Papper', 'Teckna & måla', 10, 47.30, 473.00);
    END IF;
    v_order_counter := v_order_counter + 1;

    -- Ingrid Holm buying for Polhemskolan
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'SCH-' || LPAD(v_order_counter::TEXT, 6, '0'), v_skola_polhemskolan, v_teacher_ingrid, 6780.00, 'completed', NOW() - INTERVAL '15 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-301', 'Metallslöjd Grundkit', 'Metallslöjd', 'Trä & metall', 6, 695.00, 4170.00),
        (v_order_id, 'PROD-302', 'Lödkolv Set', 'Verktyg', 'Trä & metall', 6, 289.00, 1734.00),
        (v_order_id, 'PROD-303', 'Koppartråd 1mm 50m', 'Metallmaterial', 'Trä & metall', 10, 87.60, 876.00);
    END IF;
    v_order_counter := v_order_counter + 1;

    -- Eva Bergqvist buying for Dragonskolan
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'SCH-' || LPAD(v_order_counter::TEXT, 6, '0'), v_skola_dragonskolan, v_teacher_eva, 2150.00, 'pending', NOW() - INTERVAL '3 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-401', 'Vävstol Mini Klassrum', 'Vävning', 'Textil', 4, 389.00, 1556.00),
        (v_order_id, 'PROD-402', 'Garn Bomull Sorterat', 'Garn', 'Textil', 8, 74.25, 594.00);
    END IF;
    v_order_counter := v_order_counter + 1;

    -- Birgitta Ekman buying for Rönnbyskolan
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'SCH-' || LPAD(v_order_counter::TEXT, 6, '0'), v_skola_ronnbyskolan, v_teacher_birgitta, 5430.00, 'completed', NOW() - INTERVAL '60 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-501', 'Symaskin Skolmodell', 'Symaskiner', 'Textil', 3, 1295.00, 3885.00),
        (v_order_id, 'PROD-502', 'Tyg Bomull Sorterat 5m', 'Tyg', 'Textil', 5, 189.00, 945.00),
        (v_order_id, 'PROD-503', 'Sax Textil 21cm', 'Verktyg', 'Textil', 10, 60.00, 600.00);
    END IF;
    v_order_counter := v_order_counter + 1;

    -- Company orders
    -- Olof at Kreativ Ateljé
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'ORD-' || LPAD(v_order_counter::TEXT, 6, '0'), v_foretag_kreativ, v_contact_olof, 12450.00, 'completed', NOW() - INTERVAL '20 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-601', 'Oljefärg Professional Set', 'Oljefärg', 'Teckna & måla', 20, 349.00, 6980.00),
        (v_order_id, 'PROD-602', 'Duk Canvasduk 50x70', 'Canvasduk', 'Teckna & måla', 30, 129.00, 3870.00),
        (v_order_id, 'PROD-603', 'Staffli Professionell', 'Staffli', 'Teckna & måla', 2, 800.00, 1600.00);
    END IF;
    v_order_counter := v_order_counter + 1;

    -- Astrid at DesignTorget
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'ORD-' || LPAD(v_order_counter::TEXT, 6, '0'), v_foretag_designtorget, v_contact_astrid, 28900.00, 'completed', NOW() - INTERVAL '10 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-701', 'Keramik Startpaket', 'Keramik', 'Lera & keramik', 50, 299.00, 14950.00),
        (v_order_id, 'PROD-702', 'Glasyr Sorterat 12-pack', 'Glasyr', 'Lera & keramik', 30, 189.00, 5670.00),
        (v_order_id, 'PROD-703', 'Drejskiva Eldriven', 'Verktyg', 'Lera & keramik', 5, 1656.00, 8280.00);
    END IF;
    v_order_counter := v_order_counter + 1;

    -- Nils at Panduro
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'ORD-' || LPAD(v_order_counter::TEXT, 6, '0'), v_foretag_panduro, v_contact_nils, 45200.00, 'completed', NOW() - INTERVAL '5 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-801', 'Hobbysortiment Barnpaket', 'Hobby', 'Pyssel & hobby', 100, 149.00, 14900.00),
        (v_order_id, 'PROD-802', 'Pärlor Sorterade 1000st', 'Pärlor', 'Pyssel & hobby', 200, 79.00, 15800.00),
        (v_order_id, 'PROD-803', 'Lim & Klister Sortiment', 'Lim', 'Pyssel & hobby', 150, 29.00, 4350.00),
        (v_order_id, 'PROD-804', 'Modelleringsverktyg Set', 'Verktyg', 'Pyssel & hobby', 80, 127.00, 10150.00);
    END IF;
    v_order_counter := v_order_counter + 1;

    -- Private member orders
    -- Karl Karlsson
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'ORD-' || LPAD(v_order_counter::TEXT, 6, '0'), v_privat_karlsson, v_contact_karl, 789.00, 'completed', NOW() - INTERVAL '25 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-901', 'Akvarellfärg Set 24st', 'Akvarell', 'Teckna & måla', 1, 449.00, 449.00),
        (v_order_id, 'PROD-902', 'Akvarellblock 300g A4', 'Papper', 'Teckna & måla', 2, 170.00, 340.00);
    END IF;
    v_order_counter := v_order_counter + 1;

    -- Maria Johansson
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'ORD-' || LPAD(v_order_counter::TEXT, 6, '0'), v_privat_johansson, v_contact_maria_j, 1245.00, 'completed', NOW() - INTERVAL '12 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-1001', 'Virkset Nybörjare', 'Virkning', 'Textil', 1, 289.00, 289.00),
        (v_order_id, 'PROD-1002', 'Garn Merinoull 200g', 'Garn', 'Textil', 4, 139.00, 556.00),
        (v_order_id, 'PROD-1003', 'Stickor Bambu Set', 'Stickning', 'Textil', 1, 189.00, 189.00),
        (v_order_id, 'PROD-1004', 'Mönsterbok Vantar', 'Böcker', 'Textil', 1, 211.00, 211.00);
    END IF;
    v_order_counter := v_order_counter + 1;

    -- Elsa Larsson
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'ORD-' || LPAD(v_order_counter::TEXT, 6, '0'), v_privat_larsson, v_contact_elsa, 567.00, 'completed', NOW() - INTERVAL '8 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-1101', 'Snidad Dalahäst Kit', 'Träsnideri', 'Trä & metall', 1, 349.00, 349.00),
        (v_order_id, 'PROD-1102', 'Linoljefärg Röd 250ml', 'Färg', 'Trä & metall', 2, 109.00, 218.00);
    END IF;
    v_order_counter := v_order_counter + 1;

    -- Greta Svensson
    v_order_id := gen_random_uuid();
    INSERT INTO orders (id, order_number, customer_id, buyer_contact_id, total_amount, status, created_at)
    VALUES (v_order_id, 'ORD-' || LPAD(v_order_counter::TEXT, 6, '0'), v_privat_svensson, v_contact_greta, 1890.00, 'completed', NOW() - INTERVAL '40 days')
    ON CONFLICT (order_number) DO NOTHING;
    IF FOUND THEN
      INSERT INTO order_items (order_id, product_id, product_name, category_name, main_category, quantity, unit_price, line_total) VALUES
        (v_order_id, 'PROD-1201', 'Batik Färgset 8 färger', 'Batik', 'Textil', 2, 245.00, 490.00),
        (v_order_id, 'PROD-1202', 'Silkestyg 1.5m Vit', 'Tyg', 'Textil', 3, 289.00, 867.00),
        (v_order_id, 'PROD-1203', 'Vax Batik 500g', 'Batik', 'Textil', 2, 166.50, 333.00),
        (v_order_id, 'PROD-1204', 'Spännram Textil 50cm', 'Verktyg', 'Textil', 1, 200.00, 200.00);
    END IF;
    v_order_counter := v_order_counter + 1;
  END;

  -- =========================================================================
  -- 16. CASES (Support tickets)
  -- =========================================================================
  -- A case for a delayed school delivery
  INSERT INTO cases (contact_id, customer_id, subject, description, status, priority, channel, created_at)
  VALUES
    (v_teacher_eva, v_skola_dragonskolan, 'Försenad leverans - vävstolar', 'Beställde vävstolar 3 dagar sedan, ännu ej levererat. Behöver till nästa veckas lektion.', 'OPEN', 'HIGH', 'EMAIL', NOW() - INTERVAL '1 day'),
    (v_teacher_ingrid, v_skola_polhemskolan, 'Felaktig produkt levererad', 'Fick metallslöjdskit istället för keramikkit. Behöver byte.', 'PENDING', 'NORMAL', 'PHONE', NOW() - INTERVAL '5 days'),
    (v_contact_karl, v_privat_karlsson, 'Trasig förpackning', 'Akvarellfärg set anlände med skadad förpackning, färgtuber har läckt.', 'OPEN', 'NORMAL', 'EMAIL', NOW() - INTERVAL '2 days'),
    (v_contact_astrid, v_foretag_designtorget, 'Fakturafråga', 'Felaktigt belopp på faktura FTG-2024-0089. Saknar avtalad rabatt 30%.', 'OPEN', 'HIGH', 'EMAIL', NOW() - INTERVAL '3 days'),
    (v_contact_maria_j, v_privat_johansson, 'Retur av garn', 'Vill returnera 2 st Merinoull-garner, fel färg beställd.', 'RESOLVED', 'LOW', 'CHAT', NOW() - INTERVAL '10 days')
  ON CONFLICT DO NOTHING;

  -- Case messages
  INSERT INTO case_messages (case_id, body, direction, message_type, created_at)
  SELECT
    c.id,
    'Hej! Jag väntar fortfarande på min leverans av vävstolar. Order SCH-002003. Kan ni ge en uppdatering?',
    'INBOUND',
    'EMAIL',
    c.created_at + INTERVAL '10 minutes'
  FROM cases c WHERE c.subject = 'Försenad leverans - vävstolar'
  AND NOT EXISTS (SELECT 1 FROM case_messages cm WHERE cm.case_id = c.id);

  INSERT INTO case_messages (case_id, body, direction, message_type, created_at)
  SELECT
    c.id,
    'Hej Eva! Vi beklagar förseningen. Ordern har skickats och bör vara framme inom 1-2 arbetsdagar. Trackingnummer: DHL-SE-4567890.',
    'OUTBOUND',
    'EMAIL',
    c.created_at + INTERVAL '2 hours'
  FROM cases c WHERE c.subject = 'Försenad leverans - vävstolar'
  AND (SELECT COUNT(*) FROM case_messages cm WHERE cm.case_id = c.id) < 2;

  -- =========================================================================
  -- 17. SHIPMENTS
  -- =========================================================================
  INSERT INTO shipments (order_id, shipment_number, carrier, tracking_number, tracking_url, status, shipped_at, delivered_at, created_at)
  SELECT
    o.id,
    'SHP-' || SUBSTRING(o.order_number FROM 5),
    CASE WHEN RANDOM() > 0.5 THEN 'PostNord' ELSE 'DHL' END,
    'SE' || LPAD((RANDOM() * 99999999)::INT::TEXT, 8, '0'),
    'https://tracking.example.com/' || o.order_number,
    CASE o.status
      WHEN 'completed' THEN 'DELIVERED'::shipment_status
      ELSE 'IN_TRANSIT'::shipment_status
    END,
    o.created_at + INTERVAL '1 day',
    CASE o.status
      WHEN 'completed' THEN o.created_at + INTERVAL '3 days'
      ELSE NULL
    END,
    o.created_at + INTERVAL '1 day'
  FROM orders o
  WHERE NOT EXISTS (SELECT 1 FROM shipments s WHERE s.order_id = o.id)
  AND o.order_number LIKE 'SCH-%' OR o.order_number LIKE 'ORD-002%';

END;
$$;

-- Execute the function
SELECT seed_extended_dummy_data();

-- Clean up
DROP FUNCTION IF EXISTS seed_extended_dummy_data();
