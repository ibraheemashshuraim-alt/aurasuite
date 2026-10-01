-- ==============================================================================
-- AURASUITE PHASE 1: MASTER AI AGENT & KNOWLEDGE FOUNDATION MIGRATION
-- Migration: 001_phase1_agent_foundation.sql
-- ==============================================================================

-- 1. Business Profiles & User AI Instructions
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id TEXT PRIMARY KEY DEFAULT ('bprof-' || gen_random_uuid()::TEXT),
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    industry TEXT DEFAULT 'Technology',
    target_audience TEXT,
    tone_and_voice TEXT DEFAULT 'Luxury, Professional, Authoritative',
    preferred_language TEXT DEFAULT 'en-UK',
    cta_style TEXT DEFAULT 'Sophisticated, Action-Oriented',
    do_rules JSONB DEFAULT '["Highlight premium quality", "Maintain respectful, elegant tone", "Use precise industry terminology"]'::JSONB,
    dont_rules JSONB DEFAULT '["No excessive emojis", "No aggressive sales pitches", "No unverified claims"]'::JSONB,
    prohibited_claims JSONB DEFAULT '["Guaranteed 100% returns", "Cheapest in the market"]'::JSONB,
    content_examples JSONB DEFAULT '[]'::JSONB,
    platform_preferences JSONB DEFAULT '{"linkedin": true, "instagram": true, "twitter": true, "facebook": false}'::JSONB,
    custom_instructions TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_business_profile_org UNIQUE (organization_id)
);

-- 2. Master Knowledge System
CREATE TABLE IF NOT EXISTS public.knowledge_items (
    id TEXT PRIMARY KEY DEFAULT ('know-' || gen_random_uuid()::TEXT),
    organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE, -- NULL means global system knowledge
    category TEXT NOT NULL, -- 'system', 'project', 'module', 'agent', 'workflow', 'business', 'rule', 'document'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    is_system BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for category and tags filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON public.knowledge_items(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_org ON public.knowledge_items(organization_id);

-- 3. AI Provider Configurations (BYOK - Encrypted Storage)
CREATE TABLE IF NOT EXISTS public.ai_provider_configs (
    id TEXT PRIMARY KEY DEFAULT ('aipc-' || gen_random_uuid()::TEXT),
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL, -- 'gemini', 'groq', 'openai', 'claude', 'ollama'
    encrypted_api_key TEXT, -- AES-256-GCM encrypted ciphertext (Base64)
    nonce TEXT, -- 12-byte initialization vector (Base64)
    key_hint TEXT, -- e.g. "...4a1b" (safe display only)
    base_url TEXT, -- for Ollama or custom model endpoint
    default_model TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_byok BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_org_provider UNIQUE (organization_id, provider_name)
);

-- 4. Agent Definitions & Personas
CREATE TABLE IF NOT EXISTS public.agent_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code_name TEXT NOT NULL UNIQUE, -- 'researcher', 'creator', 'image_gen', 'video_gen', 'output_pkg'
    character_name TEXT NOT NULL, -- 'Saima', 'Dani', 'Mianzi', 'Zohaib', 'Aura'
    avatar_color TEXT DEFAULT 'purple',
    role_description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    default_provider TEXT DEFAULT 'gemini',
    default_model TEXT DEFAULT 'gemini-1.5-pro',
    allowed_tools JSONB DEFAULT '[]'::JSONB,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Agent Tasks (Pipeline / Work items)
CREATE TABLE IF NOT EXISTS public.agent_tasks (
    id TEXT PRIMARY KEY DEFAULT ('atask-' || gen_random_uuid()::TEXT),
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    pipeline_id TEXT, -- Groups multi-agent pipeline executions together
    agent_id TEXT REFERENCES public.agent_definitions(id),
    title TEXT NOT NULL,
    input_payload JSONB DEFAULT '{}'::JSONB,
    output_payload JSONB DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    created_by TEXT REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_org ON public.agent_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_pipeline ON public.agent_tasks(pipeline_id);

-- 6. Agent Executions (Realtime Lifecycle State Machine)
CREATE TABLE IF NOT EXISTS public.agent_executions (
    id TEXT PRIMARY KEY DEFAULT ('exec-' || gen_random_uuid()::TEXT),
    task_id TEXT REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES public.agent_definitions(id),
    character_name TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'idle', -- 'idle', 'thinking', 'researching', 'creating', 'generating', 'executing', 'waiting', 'completed', 'failed'
    current_thought TEXT DEFAULT '',
    provider_used TEXT,
    model_used TEXT,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    execution_log JSONB DEFAULT '[]'::JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_agent_executions_org ON public.agent_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_state ON public.agent_executions(state);

-- 7. Verification Records (Jarvis & Computer Task Strict Audit Trail)
-- Lifecycle: COMMAND -> ACTION -> ACTUAL RESULT CHECK -> VERIFICATION -> SUCCESS/FAILED
CREATE TABLE IF NOT EXISTS public.verification_records (
    id TEXT PRIMARY KEY DEFAULT ('verif-' || gen_random_uuid()::TEXT),
    execution_id TEXT REFERENCES public.agent_executions(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    command_requested TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    actual_result TEXT,
    screenshot_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    failure_reason TEXT,
    execution_logs TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Seed Default Agent Definitions (Matching Agent Town Characters)
INSERT INTO public.agent_definitions (id, name, code_name, character_name, avatar_color, role_description, system_prompt, default_provider)
VALUES 
(
    'agent-content-research',
    'Content Research Specialist',
    'researcher',
    'Saima',
    'orange',
    'Researches market trends, audience insights, content angles, and competitive topics.',
    'You are Saima, the Master Content Research Agent for AuraSuite. Your mission is to produce a structured, high-value Content Research Brief analyzing audience pains, topic angles, hooks, and key factual points.',
    'gemini'
),
(
    'agent-content-creator',
    'Creative Copywriter & Strategist',
    'creator',
    'Dani',
    'blue',
    'Crafts platform-tailored post copy, captivating hooks, storytelling, and compelling CTAs.',
    'You are Dani, the Lead Content Strategist and Copywriter for AuraSuite. Your mission is to consume Research Briefs and write viral, on-brand social media copy with engaging hooks, body variations, and sharp CTAs.',
    'groq'
),
(
    'agent-image-generator',
    'Visual Art Director',
    'image_gen',
    'Mianzi',
    'red',
    'Synthesizes creative visual concepts, image generation prompts, and aesthetic asset instructions.',
    'You are Mianzi, Visual Art Director for AuraSuite. Your mission is to translate marketing concepts into high-fidelity image generation prompts adhering to brand visual identity, lighting, and composition.',
    'openai'
),
(
    'agent-video-generator',
    'Motion & Video Producer',
    'video_gen',
    'Zohaib',
    'cyan',
    'Architects video storyboards, scene descriptions, voiceover scripts, and duration timing.',
    'You are Zohaib, Motion Producer for AuraSuite. Your mission is to design video scripts, scenes, transition cues, and timing for short-form and high-impact video campaigns.',
    'gemini'
),
(
    'agent-output-packaging',
    'Quality & Packaging Lead',
    'output_pkg',
    'Aura',
    'purple',
    'Reviews outputs from all agents against brand constraints, verifies quality, and builds final packages.',
    'You are Aura, Quality Assurance and Final Packaging Lead for AuraSuite. You verify that all content, assets, and metadata meet brand guidelines, passing only verified deliverables.',
    'claude'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    character_name = EXCLUDED.character_name,
    role_description = EXCLUDED.role_description,
    system_prompt = EXCLUDED.system_prompt;

-- 9. Seed AuraSuite System Knowledge
INSERT INTO public.knowledge_items (id, organization_id, category, title, content, tags, is_system)
VALUES
(
    'know-sys-aurasuite-core',
    NULL,
    'system',
    'AuraSuite Platform Architecture & Mission',
    'AuraSuite is a high-performance, multi-tenant AI team management and automation platform. It operates in 3 distinct modes: Software House, Academy, and Factory. It incorporates Agent Town as a live visual representation of autonomous agents collaborating with human team members.',
    ARRAY['aurasuite', 'architecture', 'core', 'mission'],
    TRUE
),
(
    'know-sys-brand-rules',
    NULL,
    'rule',
    'Brand Consistency and Token Discipline',
    'All AuraSuite generated content must maintain high brand fidelity, adhere strictly to user Do and Don''t rules, respect token budgets, and never fabricate unverified claims. Output must be structured and directly consumable by downstream agents.',
    ARRAY['rules', 'brand', 'quality'],
    TRUE
),
(
    'know-sys-jarvis-verification',
    NULL,
    'rule',
    'Computer Task Verification Protocol',
    'A computer or browser task is NEVER complete simply because an agent or execution daemon reports done. Every task must undergo: COMMAND -> ACTION -> ACTUAL RESULT CHECK -> VERIFICATION -> SUCCESS/FAILED.',
    ARRAY['jarvis', 'computer-use', 'verification', 'security'],
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content;

-- 10. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_business_profiles" ON public.business_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_knowledge_items" ON public.knowledge_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_ai_provider_configs" ON public.ai_provider_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_agent_definitions" ON public.agent_definitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_agent_tasks" ON public.agent_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_agent_executions" ON public.agent_executions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_verification_records" ON public.verification_records FOR ALL USING (true) WITH CHECK (true);

-- 11. Add to Supabase Realtime Publication for Live Sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_profiles;
