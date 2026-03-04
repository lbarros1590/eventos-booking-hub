-- Inserção de feriados nacionais 2026 e 2027
-- Valor fixo de 600, não estão bloqueados inicialmente
-- O comando ON CONFLICT atualiza o preço e nota se a data já existir na tabela.

INSERT INTO public.calendar_exceptions (exception_date, custom_price, is_blocked, note)
VALUES 
  -- 2026 Feriados Fixos
  ('2026-01-01', 1600, false, 'Ano Novo (Confraternização Universal)'),
  ('2026-04-21', 600, false, 'Tiradentes'),
  ('2026-05-01', 600, false, 'Dia do Trabalho'),
  ('2026-09-07', 600, false, 'Independência do Brasil'),
  ('2026-10-12', 600, false, 'Nossa Senhora Aparecida / Dia das Crianças'),
  ('2026-11-02', 600, false, 'Finados'),
  ('2026-11-15', 600, false, 'Proclamação da República'),
  ('2026-11-20', 600, false, 'Dia da Consciência Negra'),
  ('2026-12-25', 1600, false, 'Natal'),
  
  -- 2026 Feriados Móveis (Cálculos de Páscoa: 05/04/2026)
  ('2026-02-16', 600, false, 'Carnaval (Recesso)'),
  ('2026-02-17', 600, false, 'Carnaval'),
  ('2026-04-03', 600, false, 'Paixão de Cristo (Sexta-feira Santa)'),
  ('2026-06-04', 600, false, 'Corpus Christi'),

  -- 2027 Feriados Fixos
  ('2027-01-01', 1600, false, 'Ano Novo (Confraternização Universal)'),
  ('2027-04-21', 600, false, 'Tiradentes'),
  ('2027-05-01', 600, false, 'Dia do Trabalho'),
  ('2027-09-07', 600, false, 'Independência do Brasil'),
  ('2027-10-12', 600, false, 'Nossa Senhora Aparecida / Dia das Crianças'),
  ('2027-11-02', 600, false, 'Finados'),
  ('2027-11-15', 600, false, 'Proclamação da República'),
  ('2027-11-20', 600, false, 'Dia da Consciência Negra'),
  ('2027-12-25', 1600, false, 'Natal'),
  
  -- 2027 Feriados Móveis (Cálculos de Páscoa: 28/03/2027)
  ('2027-02-08', 600, false, 'Carnaval (Recesso)'),
  ('2027-02-09', 600, false, 'Carnaval'),
  ('2027-03-26', 600, false, 'Paixão de Cristo (Sexta-feira Santa)'),
  ('2027-05-27', 600, false, 'Corpus Christi')

ON CONFLICT (exception_date) 
DO UPDATE SET 
  custom_price = EXCLUDED.custom_price,
  note = EXCLUDED.note;
