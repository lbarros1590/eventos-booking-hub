-- Add checklist_data JSONB column to bookings
-- This stores the full interactive checklist: [{ id, item, category, status: 'ok'|'observation'|'problem', observation: string }]
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS checklist_data JSONB;
