-- First update existing data to temporary values to avoid conflicts
UPDATE contacts SET contact_type = 'Other' WHERE contact_type = 'Member';
UPDATE contacts SET contact_type = 'Other' WHERE contact_type = 'Newsletter';
UPDATE contacts SET contact_type = 'Other' WHERE contact_type = 'Buyer';

-- Create new enum type with Swedish values
CREATE TYPE contact_type_new AS ENUM ('Medlem', 'Nyhetsbrev', 'Lärare', 'Köpare', 'Övrig');

-- Add temporary column
ALTER TABLE contacts ADD COLUMN contact_type_temp contact_type_new;

-- Migrate data
UPDATE contacts SET contact_type_temp = 'Lärare' WHERE contact_type = 'Teacher';
UPDATE contacts SET contact_type_temp = 'Övrig' WHERE contact_type = 'Other';

-- Drop old column and rename new one
ALTER TABLE contacts DROP COLUMN contact_type;
ALTER TABLE contacts RENAME COLUMN contact_type_temp TO contact_type;

-- Set default
ALTER TABLE contacts ALTER COLUMN contact_type SET DEFAULT 'Övrig';

-- Drop old enum type and rename new one
DROP TYPE contact_type;
ALTER TYPE contact_type_new RENAME TO contact_type;