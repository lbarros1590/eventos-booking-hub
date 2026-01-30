-- Add new fields to profiles table for client management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS loyalty_points integer NOT NULL DEFAULT 0;

-- Add new fields to bookings table for loyalty tracking and origin
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS discount_applied numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS origin text DEFAULT 'web';

-- Add payment_date to expenses table for cash flow tracking
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS payment_date date;

-- Update existing expenses to have payment_date match expense_date
UPDATE public.expenses 
SET payment_date = expense_date 
WHERE payment_date IS NULL;