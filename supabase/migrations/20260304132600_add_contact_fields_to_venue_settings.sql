-- Add contact info fields to venue_settings
ALTER TABLE venue_settings
  ADD COLUMN IF NOT EXISTS owner_whatsapp TEXT DEFAULT '5565992286607',
  ADD COLUMN IF NOT EXISTS owner_name TEXT DEFAULT 'EJ Eventos',
  ADD COLUMN IF NOT EXISTS owner_instagram TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS owner_facebook TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS owner_email TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS venue_address TEXT DEFAULT 'R. dos Cravos, 174 – Serra Dourada, Cuiabá – MT, CEP 78056-239';

-- Populate the default phone in the existing row
UPDATE venue_settings SET owner_whatsapp = '5565992286607' WHERE owner_whatsapp IS NULL;
