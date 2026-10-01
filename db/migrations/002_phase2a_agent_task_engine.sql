-- ==============================================================================
-- AURASUITE PHASE 2A: AGENT & TASK ENGINE MIGRATION
-- Migration: 002_phase2a_agent_task_engine.sql
-- ==============================================================================

-- 1. Agents Table (UI-facing Agent Management)
CREATE TABLE IF NOT EXISTS public.agents (
    id TEXT PRIMARY KEY DEFAULT ('agent-' || gen_random_uuid()::TEXT),
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    provider TEXT DEFAULT 'gemini',
    model TEXT DEFAULT 'gemini-1.5-pro',
    status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'DISABLED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_org ON public.agents(organization_id);

-- 2. Tasks Table (Task Management Engine)
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY DEFAULT ('task-' || gen_random_uuid()::TEXT),
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    assigned_agent_id TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    priority TEXT DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH'
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'RUNNING', 'VERIFYING', 'COMPLETED', 'FAILED', 'CANCELLED'
    result TEXT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "public_all_agents" ON public.agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Add to Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
