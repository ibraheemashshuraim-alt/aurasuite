import { supabase } from '../../supabase';
import { decryptKey } from '../crypto';
import { generateAI } from '../providers';
import { getRelevantKnowledge } from '../knowledge/knowledgeService';
import { assembleContext } from '../context/contextBuilder';
import { transitionAgentState } from './stateMachine';

// Default Agent definitions matching Agent Town
const DEFAULT_AGENTS = {
  researcher: {
    id: 'agent-content-research',
    name: 'Content Research Specialist',
    code_name: 'researcher',
    character_name: 'Saima',
    avatar_color: 'orange',
    role_description: 'Researches market trends, audience insights, and content angles.',
    system_prompt: 'You are Saima, the Master Content Research Agent for AuraSuite. Your mission is to produce a structured, high-value Content Research Brief analyzing audience pains, topic angles, hooks, and key factual points.',
    default_provider: 'gemini',
    default_model: 'gemini-1.5-flash',
  },
  creator: {
    id: 'agent-content-creator',
    name: 'Creative Copywriter & Strategist',
    code_name: 'creator',
    character_name: 'Dani',
    avatar_color: 'blue',
    role_description: 'Crafts platform-tailored post copy, captivating hooks, and compelling CTAs.',
    system_prompt: 'You are Dani, Lead Content Strategist and Copywriter for AuraSuite. Your mission is to consume Research Briefs and write viral, on-brand social media copy with engaging hooks, body variations, and sharp CTAs.',
    default_provider: 'groq',
    default_model: 'llama-3.3-70b-versatile',
  },
  image_gen: {
    id: 'agent-image-generator',
    name: 'Visual Art Director',
    code_name: 'image_gen',
    character_name: 'Mianzi',
    avatar_color: 'red',
    role_description: 'Synthesizes creative visual concepts and image generation prompts.',
    system_prompt: 'You are Mianzi, Visual Art Director for AuraSuite. Your mission is to translate marketing concepts into high-fidelity image generation prompts adhering to brand visual identity.',
    default_provider: 'openai',
    default_model: 'gpt-4o-mini',
  },
  video_gen: {
    id: 'agent-video-generator',
    name: 'Motion & Video Producer',
    code_name: 'video_gen',
    character_name: 'Zohaib',
    avatar_color: 'cyan',
    role_description: 'Architects video storyboards, scene descriptions, and voiceover scripts.',
    system_prompt: 'You are Zohaib, Motion Producer for AuraSuite. Your mission is to design video scripts, scenes, transition cues, and timing for short-form and high-impact campaigns.',
    default_provider: 'gemini',
    default_model: 'gemini-1.5-flash',
  },
  output_pkg: {
    id: 'agent-output-packaging',
    name: 'Quality & Packaging Lead',
    code_name: 'output_pkg',
    character_name: 'Aura',
    avatar_color: 'purple',
    role_description: 'Reviews outputs, verifies quality, and builds final packages.',
    system_prompt: 'You are Aura, Quality Assurance and Final Packaging Lead for AuraSuite. You verify that all content, assets, and metadata meet brand guidelines.',
    default_provider: 'claude',
    default_model: 'claude-3-5-sonnet-20241022',
  },
};

/**
 * Execute an agent task through the complete orchestration lifecycle
 */
export async function executeOrchestratedTask({
  organizationId,
  agentCodeName = 'researcher',
  title,
  inputPayload = {},
  upstreamResults = {},
  createdBy = null,
}) {
  const taskId = `atask-${Date.now()}`;
  const executionId = `exec-${Date.now()}`;

  // 1. Resolve Agent Definition
  const agent = DEFAULT_AGENTS[agentCodeName] || DEFAULT_AGENTS.researcher;

  // 2. Initialize records in Supabase
  try {
    await supabase.from('agent_tasks').insert({
      id: taskId,
      organization_id: organizationId,
      agent_id: agent.id,
      title,
      input_payload: inputPayload,
      status: 'running',
      created_by: createdBy,
    });

    await supabase.from('agent_executions').insert({
      id: executionId,
      task_id: taskId,
      organization_id: organizationId,
      agent_id: agent.id,
      character_name: agent.character_name,
      state: 'thinking',
      current_thought: `${agent.character_name} is reviewing task directives...`,
      execution_log: [{
        timestamp: new Date().toISOString(),
        state: 'thinking',
        thought: 'Task initialized',
        event: 'execution_started',
      }],
    });
  } catch (dbErr) {
    console.warn('Initial execution DB record failed:', dbErr.message);
  }

  // Determine active state
  let activeState = 'researching';
  if (agentCodeName === 'creator') activeState = 'creating';
  else if (agentCodeName === 'image_gen' || agentCodeName === 'video_gen') activeState = 'generating';

  await transitionAgentState({
    executionId,
    newState: activeState,
    thought: `${agent.character_name} is assembling context and instructions...`,
    event: 'context_assembly_started',
  });

  try {
    // 3. Fetch Business Profile
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    // 4. Fetch Relevant Knowledge
    const knowledgeItems = await getRelevantKnowledge({
      orgId: organizationId,
      category: '',
    });

    // 5. Assemble Context
    const assembled = assembleContext({
      agent,
      businessProfile,
      knowledgeItems,
      taskTitle: title,
      taskInput: inputPayload,
      previousResults: upstreamResults,
    });

    // 6. Resolve AI Provider & Decrypt BYOK API Key
    const { providerName, apiKey, model } = await resolveProviderCredentials(organizationId, agent.default_provider, agent.default_model);

    await transitionAgentState({
      executionId,
      newState: activeState,
      thought: `Querying model ${model} via ${providerName}...`,
      event: 'model_invocation_started',
    });

    // 7. Invoke Provider
    const genResult = await generateAI(providerName, {
      apiKey,
      model,
      systemPrompt: assembled.systemPrompt,
      prompt: assembled.userPrompt,
      temperature: 0.7,
    });

    // 8. Finalize Output & Transition to Completed
    const outputPayload = {
      output_text: genResult.text,
      model_used: genResult.model,
      provider: genResult.provider,
      agent: agent.character_name,
      timestamp: new Date().toISOString(),
    };

    await supabase
      .from('agent_tasks')
      .update({
        status: 'completed',
        output_payload: outputPayload,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    await supabase
      .from('agent_executions')
      .update({
        provider_used: genResult.provider,
        model_used: genResult.model,
        prompt_tokens: genResult.promptTokens,
        completion_tokens: genResult.completionTokens,
      })
      .eq('id', executionId);

    await transitionAgentState({
      executionId,
      newState: 'completed',
      thought: `${agent.character_name} successfully finalized the task!`,
      event: 'execution_completed',
    });

    return {
      taskId,
      executionId,
      agentName: agent.name,
      character: agent.character_name,
      status: 'completed',
      output: outputPayload,
    };
  } catch (err) {
    console.error('Agent execution failed:', err);
    await transitionAgentState({
      executionId,
      newState: 'failed',
      thought: `Execution error: ${err.message}`,
      event: 'execution_failed',
    });

    await supabase
      .from('agent_tasks')
      .update({ status: 'failed' })
      .eq('id', taskId);

    throw err;
  }
}

/**
 * Resolve provider credentials, decrypting BYOK key in-memory
 */
async function resolveProviderCredentials(orgId, defaultProvider, defaultModel) {
  try {
    const { data: configs } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    if (configs && configs.length > 0) {
      // Find matching preferred provider or fallback to first available
      const cfg = configs.find(c => c.provider_name === defaultProvider) || configs[0];
      if (cfg && cfg.encrypted_api_key && cfg.nonce) {
        const plainKey = decryptKey(cfg.encrypted_api_key, cfg.nonce);
        return {
          providerName: cfg.provider_name,
          apiKey: plainKey,
          model: cfg.default_model || defaultModel,
        };
      }
    }
  } catch (e) {
    console.warn('BYOK decryption lookup failed, using server environment fallback:', e.message);
  }

  // Fallback to server environment keys
  return {
    providerName: defaultProvider || 'gemini',
    apiKey: process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '',
    model: defaultModel,
  };
}
