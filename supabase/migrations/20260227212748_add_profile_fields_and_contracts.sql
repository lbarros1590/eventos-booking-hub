-- ============================================================
-- 1. Adiciona campos de documentos e endereço ao perfil
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf    TEXT,
  ADD COLUMN IF NOT EXISTS rg     TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;

-- ============================================================
-- 2. Atualiza o trigger handle_new_user para capturar cpf e address
--    quando o usuário se cadastra pelo formulário web
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, phone, birth_date, cpf, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::DATE,
    NULLIF(NEW.raw_user_meta_data->>'cpf', ''),
    NULLIF(NEW.raw_user_meta_data->>'address', '')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 3. Cria tabela contracts para salvar contratos gerados
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  profile_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  html_content  TEXT NOT NULL,
  generated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  signed_at     TIMESTAMP WITH TIME ZONE,
  notes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_contracts_booking_id ON public.contracts(booking_id);
CREATE INDEX IF NOT EXISTS idx_contracts_profile_id ON public.contracts(profile_id);

-- ============================================================
-- 4. Habilita RLS na tabela contracts
-- ============================================================
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Admins podem ver e gerenciar todos os contratos
CREATE POLICY "Admins can manage all contracts"
  ON public.contracts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Usuários podem ver seus próprios contratos
CREATE POLICY "Users can view their own contracts"
  ON public.contracts FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );
