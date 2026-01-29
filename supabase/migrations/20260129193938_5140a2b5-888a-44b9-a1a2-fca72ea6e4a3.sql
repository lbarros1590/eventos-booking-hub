-- Create venue_settings table (singleton for global settings)
CREATE TABLE public.venue_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_price_weekday numeric NOT NULL DEFAULT 400,
  base_price_weekend numeric NOT NULL DEFAULT 600,
  cleaning_fee numeric NOT NULL DEFAULT 70,
  global_discount_percent numeric NOT NULL DEFAULT 0,
  hero_image_url text,
  amenities_list jsonb DEFAULT '[
    {"id": 1, "name": "Piscina Adulto", "icon": "Waves"},
    {"id": 2, "name": "Piscina Infantil", "icon": "Baby"},
    {"id": 3, "name": "Churrasqueira", "icon": "Flame"},
    {"id": 4, "name": "Suíte com Ar", "icon": "Wind"},
    {"id": 5, "name": "Área Coberta Grande", "icon": "Home"},
    {"id": 6, "name": "Área ao Ar Livre", "icon": "Sun"},
    {"id": 7, "name": "Freezer Grande", "icon": "Snowflake"},
    {"id": 8, "name": "Mesa Inox Grande", "icon": "Square"},
    {"id": 9, "name": "Fogão Industrial", "icon": "ChefHat"},
    {"id": 10, "name": "25 Cadeiras Brancas", "icon": "Armchair"},
    {"id": 11, "name": "7 Mesas Brancas", "icon": "Table"},
    {"id": 12, "name": "Ventiladores", "icon": "Fan"},
    {"id": 13, "name": "Wi-Fi Grátis", "icon": "Wifi"}
  ]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on venue_settings
ALTER TABLE public.venue_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read venue settings (public data)
CREATE POLICY "Anyone can view venue settings"
ON public.venue_settings
FOR SELECT
USING (true);

-- Only admins can update venue settings
CREATE POLICY "Admins can update venue settings"
ON public.venue_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert venue settings
CREATE POLICY "Admins can insert venue settings"
ON public.venue_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings row
INSERT INTO public.venue_settings (id) VALUES (gen_random_uuid());

-- Create calendar_exceptions table for holidays and special dates
CREATE TABLE public.calendar_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_date date NOT NULL UNIQUE,
  custom_price numeric,
  is_blocked boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on calendar_exceptions
ALTER TABLE public.calendar_exceptions ENABLE ROW LEVEL SECURITY;

-- Anyone can read calendar exceptions (for availability display)
CREATE POLICY "Anyone can view calendar exceptions"
ON public.calendar_exceptions
FOR SELECT
USING (true);

-- Admins can manage calendar exceptions
CREATE POLICY "Admins can manage calendar exceptions"
ON public.calendar_exceptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for venue images
INSERT INTO storage.buckets (id, name, public) VALUES ('venue-images', 'venue-images', true);

-- Storage policies for venue images
CREATE POLICY "Anyone can view venue images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'venue-images');

CREATE POLICY "Admins can upload venue images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'venue-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update venue images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'venue-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete venue images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'venue-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for venue_settings updated_at
CREATE TRIGGER update_venue_settings_updated_at
BEFORE UPDATE ON public.venue_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();