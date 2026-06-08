-- AuraSuite Supabase Schema
-- Run this entire script in your Supabase SQL Editor

-- 1. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'software_house',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'worker',
    category TEXT,
    domain TEXT,
    skills JSONB DEFAULT '[]'::JSONB,
    last_seen TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'todo',
    payout_approved BOOLEAN DEFAULT FALSE,
    final_payout NUMERIC DEFAULT 0,
    suggested_payout NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Meetings
CREATE TABLE IF NOT EXISTS public.meetings (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id),
    host_id TEXT REFERENCES public.profiles(id),
    host_name TEXT,
    title TEXT NOT NULL,
    meeting_id TEXT,
    passcode TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Meeting States (live participants/chat per meeting)
CREATE TABLE IF NOT EXISTS public.meeting_states (
    meeting_id TEXT PRIMARY KEY REFERENCES public.meetings(id) ON DELETE CASCADE,
    participants JSONB DEFAULT '[]'::JSONB,
    chat JSONB DEFAULT '[]'::JSONB,
    is_chat_locked BOOLEAN DEFAULT FALSE,
    are_all_muted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Meeting Invites
CREATE TABLE IF NOT EXISTS public.meeting_invites (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    meeting_id TEXT REFERENCES public.meetings(id) ON DELETE CASCADE,
    invitees JSONB DEFAULT '[]'::JSONB
);

-- 7. Group Messages
CREATE TABLE IF NOT EXISTS public.group_messages (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id),
    from_id TEXT REFERENCES public.profiles(id),
    from_name TEXT,
    text TEXT NOT NULL,
    msg_time TEXT,
    type TEXT DEFAULT 'chat',
    meeting_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. DM Threads
CREATE TABLE IF NOT EXISTS public.dm_messages (
    id TEXT PRIMARY KEY,
    thread_key TEXT NOT NULL,
    from_id TEXT REFERENCES public.profiles(id),
    from_name TEXT,
    text TEXT NOT NULL,
    msg_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Schedules
CREATE TABLE IF NOT EXISTS public.schedules (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES public.organizations(id),
    title TEXT NOT NULL,
    event_time TIMESTAMP WITH TIME ZONE,
    color TEXT DEFAULT 'border-purple-500',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Financials (budget per org)
CREATE TABLE IF NOT EXISTS public.financials (
    organization_id TEXT PRIMARY KEY REFERENCES public.organizations(id),
    budget NUMERIC DEFAULT 150000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Presence (online tracking)
CREATE TABLE IF NOT EXISTS public.presence (
    user_id TEXT PRIMARY KEY REFERENCES public.profiles(id),
    organization_id TEXT REFERENCES public.organizations(id),
    last_seen BIGINT DEFAULT 0
);

-- ── Enable Row Level Security ──
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;

-- ── Allow full public access (for development) ──
CREATE POLICY "public_all_organizations" ON public.organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_meetings" ON public.meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_meeting_states" ON public.meeting_states FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_meeting_invites" ON public.meeting_invites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_group_messages" ON public.group_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_dm_messages" ON public.dm_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_schedules" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_financials" ON public.financials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_presence" ON public.presence FOR ALL USING (true) WITH CHECK (true);

-- ── Enable Realtime for live sync ──
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_invites;
