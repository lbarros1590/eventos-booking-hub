-- =====================================================
-- REFACTORING TO PROFILE-FIRST ARCHITECTURE
-- =====================================================

-- 1. Make user_id nullable in profiles for manual clients
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add profile_id to bookings (will reference profiles.id)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id);

-- 3. Add payment_method to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 4. Migrate existing bookings: link user_id to profile_id
UPDATE public.bookings b
SET profile_id = p.id
FROM public.profiles p
WHERE b.user_id = p.user_id AND b.profile_id IS NULL;

-- 5. Create a unique constraint on phone in profiles for validation
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx 
ON public.profiles(phone) 
WHERE phone IS NOT NULL AND phone != '';

-- 6. Update the handle_new_user trigger to work with the new schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, name, phone, birth_date, email, loyalty_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'birth_date')::date,
    NEW.email,
    0
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 7. Drop and recreate RLS policies for bookings to handle profile_id
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can check booked dates" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;

-- Recreate booking policies
CREATE POLICY "Admins can manage all bookings"
ON public.bookings
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can check booked dates"
ON public.bookings
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create their own bookings"
ON public.bookings
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their own bookings"
ON public.bookings
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own bookings"
ON public.bookings
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR 
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 8. Create function to deduct loyalty points when discount is used
CREATE OR REPLACE FUNCTION public.deduct_loyalty_points_on_discount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If discount was applied and booking is being confirmed
  IF NEW.discount_applied > 0 AND NEW.status = 'confirmed' AND 
     (OLD.status IS DISTINCT FROM 'confirmed' OR OLD.discount_applied IS DISTINCT FROM NEW.discount_applied) THEN
    -- Deduct 4 loyalty points from the profile
    UPDATE public.profiles
    SET loyalty_points = GREATEST(0, loyalty_points - 4)
    WHERE id = NEW.profile_id OR user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for loyalty point deduction
DROP TRIGGER IF EXISTS trigger_deduct_loyalty_on_discount ON public.bookings;
CREATE TRIGGER trigger_deduct_loyalty_on_discount
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.deduct_loyalty_points_on_discount();