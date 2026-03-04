-- Add is_active column to profiles for soft deletion
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing profiles just in case
UPDATE profiles SET is_active = true WHERE is_active IS NULL;
