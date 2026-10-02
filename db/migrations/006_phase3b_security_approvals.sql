-- ==============================================================================
-- AURASUITE PHASE 3B: SECURITY AND APPROVALS
-- Migration: 006_phase3b_security_approvals.sql
-- ==============================================================================

-- 1. Fix RLS on engine_action_plans to enforce organization_id isolation
DO $$
BEGIN
    DROP POLICY IF EXISTS "public_all_engine_action_plans" ON public.engine_action_plans;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

CREATE POLICY "org_isolated_action_plans_select" 
ON public.engine_action_plans FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "org_isolated_action_plans_insert" 
ON public.engine_action_plans FOR INSERT 
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "org_isolated_action_plans_update" 
ON public.engine_action_plans FOR UPDATE 
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
);

-- We also make sure engine_execution_logs are protected
DO $$
BEGIN
    DROP POLICY IF EXISTS "public_all_engine_execution_logs" ON public.engine_execution_logs;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

CREATE POLICY "org_isolated_execution_logs_select" 
ON public.engine_execution_logs FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
);

CREATE POLICY "org_isolated_execution_logs_insert" 
ON public.engine_execution_logs FOR INSERT 
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users WHERE id = auth.uid()
  )
);

NOTIFY pgrst, 'reload schema';
