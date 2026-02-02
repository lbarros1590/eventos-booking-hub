-- Create inventory_items table for dynamic venue inventory management
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'Geral',
  icon_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active inventory items"
ON public.inventory_items
FOR SELECT
USING (true);

-- Admin full access
CREATE POLICY "Admins can manage inventory items"
ON public.inventory_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data from current amenities
INSERT INTO public.inventory_items (name, quantity, category, icon_name) VALUES
  ('Piscina Adulto', 1, 'Lazer', 'Waves'),
  ('Piscina Infantil', 1, 'Lazer', 'Baby'),
  ('Churrasqueira', 1, 'Equipamentos', 'Flame'),
  ('Suíte com Ar', 1, 'Infraestrutura', 'Wind'),
  ('Área Coberta Grande', 1, 'Infraestrutura', 'Home'),
  ('Área ao Ar Livre', 1, 'Infraestrutura', 'Sun'),
  ('Freezer Grande', 1, 'Eletrodomésticos', 'Snowflake'),
  ('Mesa Inox Grande', 1, 'Equipamentos', 'Square'),
  ('Fogão Industrial', 1, 'Eletrodomésticos', 'ChefHat'),
  ('Cadeiras Brancas', 25, 'Mobiliário', 'Armchair'),
  ('Mesas Brancas', 7, 'Mobiliário', 'Table'),
  ('Ventiladores', 4, 'Eletrodomésticos', 'Fan'),
  ('Wi-Fi Grátis', 1, 'Infraestrutura', 'Wifi');