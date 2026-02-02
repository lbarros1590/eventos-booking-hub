-- Allow null user_id in bookings for manual reservations
ALTER TABLE public.bookings 
ALTER COLUMN user_id DROP NOT NULL;