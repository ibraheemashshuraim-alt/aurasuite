-- ==============================================================================
-- AURASUITE PHASE 2B: AGENT MEMORY MIGRATION
-- Migration: 003_phase2b_agent_memory.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.agent_memories (
    id TEXT PRIMARY KEY DEFAULT ('mem-' || gen_random_uuid()::TEXT),
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    memory_type TEXT DEFAULT 'general', -- 'general', 'instruction', 'preference', 'fact'
    content TEXT NOT NULL,
    source_task_id TEXT REFERENCES public.engine_tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_memories_org ON public.agent_memories(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_agent ON public.agent_memories(agent_id);

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_agent_memories" ON public.agent_memories FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_memories;

NOTIFY pgrst, 'reload schema';
