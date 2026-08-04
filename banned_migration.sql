-- Supabase Migration: Banned Emails and Revoked Cards

-- 1. Create Banned Emails Table
CREATE TABLE IF NOT EXISTS public.banned_emails (
    email TEXT PRIMARY KEY,
    banned_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all_banned_emails" ON public.banned_emails FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.banned_emails;

-- 2. Add 'is_revoked' column to digital_cards
ALTER TABLE public.digital_cards ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN DEFAULT FALSE;
