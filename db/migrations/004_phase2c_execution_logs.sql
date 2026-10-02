-- ==============================================================================
-- AURASUITE PHASE 2C: EXECUTION LOGS MIGRATION
-- Migration: 004_phase2c_execution_logs.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.engine_execution_logs (
    id TEXT PRIMARY KEY DEFAULT ('elog-' || gen_random_uuid()::TEXT),
    task_id TEXT NOT NULL REFERENCES public.engine_tasks(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elog_task ON public.engine_execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_elog_agent ON public.engine_execution_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_elog_org ON public.engine_execution_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_elog_created ON public.engine_execution_logs(created_at);

ALTER TABLE public.engine_execution_logs ENABLE ROW LEVEL SECURITY;

DO $ $
BEGIN
    DROP POLICY IF EXISTS "public_all_engine_execution_logs" ON public.engine_execution_logs;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $ $;

CREATE POLICY "public_all_engine_execution_logs" ON public.engine_execution_logs FOR ALL USING (true) WITH CHECK (true);

DO $ $
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.engine_execution_logs;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $ $;

NOTIFY pgrst, 'reload schema';
