-- ==============================================================================
-- AURASUITE PHASE 3A: ACTION PLANS MIGRATION
-- Migration: 005_phase3a_action_plans.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.engine_action_plans (
    id TEXT PRIMARY KEY DEFAULT ('aplan-' || gen_random_uuid()::TEXT),
    task_id TEXT NOT NULL REFERENCES public.engine_tasks(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'PENDING', -- PENDING, VALIDATING, EXECUTING, COMPLETED, FAILED, BLOCKED, APPROVAL_REQUIRED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aplan_task ON public.engine_action_plans(task_id);
CREATE INDEX IF NOT EXISTS idx_aplan_org ON public.engine_action_plans(organization_id);

ALTER TABLE public.engine_action_plans ENABLE ROW LEVEL SECURITY;

DO $ $
BEGIN
    DROP POLICY IF EXISTS "public_all_engine_action_plans" ON public.engine_action_plans;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $ $;

CREATE POLICY "public_all_engine_action_plans" ON public.engine_action_plans FOR ALL USING (true) WITH CHECK (true);

DO $ $
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.engine_action_plans;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $ $;

NOTIFY pgrst, 'reload schema';
