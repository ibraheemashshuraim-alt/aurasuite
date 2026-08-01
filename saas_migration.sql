-- Migration: Multi-Tenant SaaS Organizations

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS team_size TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
