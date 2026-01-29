-- Add new columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN deposit_paid boolean NOT NULL DEFAULT false,
ADD COLUMN final_balance_paid boolean NOT NULL DEFAULT false,
ADD COLUMN manual_price_override numeric DEFAULT NULL,
ADD COLUMN waive_cleaning_fee boolean NOT NULL DEFAULT false,
ADD COLUMN custom_checklist_items jsonb DEFAULT NULL;

-- Update venue_settings: add gallery_urls and payment_terms_text
ALTER TABLE public.venue_settings
ADD COLUMN gallery_urls text[] DEFAULT ARRAY[]::text[],
ADD COLUMN payment_terms_text text DEFAULT '50% no ato da reserva, 50% na entrega das chaves.',
ADD COLUMN default_checklist_items jsonb DEFAULT '[
  {"id": 1, "item": "Mesas (7 unidades)", "checked": false},
  {"id": 2, "item": "Cadeiras (25 unidades)", "checked": false},
  {"id": 3, "item": "Churrasqueira limpa", "checked": false},
  {"id": 4, "item": "Freezer funcionando", "checked": false},
  {"id": 5, "item": "Fogão industrial limpo", "checked": false},
  {"id": 6, "item": "Piscina tratada", "checked": false},
  {"id": 7, "item": "Área externa limpa", "checked": false},
  {"id": 8, "item": "Banheiros limpos", "checked": false},
  {"id": 9, "item": "Ar condicionado funcionando", "checked": false},
  {"id": 10, "item": "Wi-Fi disponível", "checked": false}
]'::jsonb;

-- Migrate existing hero_image_url to gallery_urls
UPDATE public.venue_settings 
SET gallery_urls = CASE 
  WHEN hero_image_url IS NOT NULL AND hero_image_url != '' 
  THEN ARRAY[hero_image_url]
  ELSE ARRAY[]::text[]
END;