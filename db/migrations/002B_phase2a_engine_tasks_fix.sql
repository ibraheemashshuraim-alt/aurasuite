-- ==============================================================================
-- AURASUITE PHASE 2A: AGENT & TASK ENGINE MIGRATION
-- Migration: 002B_phase2a_engine_tasks_fix.sql
-- Note: 'tasks' table already existed in AuraSuite, renaming Phase 2A tasks to 'engine_tasks'.
-- ==============================================================================

-- 1. Create Engine Tasks Table (Task Management Engine)
CREATE TABLE IF NOT EXISTS public.engine_tasks (
    id TEXT PRIMARY KEY DEFAULT ('task-' || gen_random_uuid()::TEXT),
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    assigned_agent_id TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'PENDING',
    result TEXT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_engine_tasks_org ON public.engine_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_engine_tasks_status ON public.engine_tasks(status);

-- 2. Enable RLS
ALTER TABLE public.engine_tasks ENABLE ROW LEVEL SECURITY;

-- 3. Safely Handle Policies
DO $ $
BEGIN
    DROP POLICY IF EXISTS "public_all_engine_tasks" ON public.engine_tasks;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $ $;

CREATE POLICY "public_all_engine_tasks" ON public.engine_tasks FOR ALL USING (true) WITH CHECK (true);

-- 4. Add to Realtime
DO $ $
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.engine_tasks;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $ $;

-- 5. Reload Cache
NOTIFY pgrst, 'reload schema';
