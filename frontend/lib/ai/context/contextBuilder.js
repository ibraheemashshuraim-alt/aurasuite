/**
 * Central ContextBuilder for token-conscious, modular context assembly
 */
export function assembleContext({
  agent,
  businessProfile,
  knowledgeItems = [],
  taskTitle,
  taskInput = {},
  previousResults = {},
  allowedTools = [],
}) {
  const sysParts = [];

  // 1. Agent Persona & Role
  sysParts.push(`=== AGENT ROLE: ${agent.character_name || agent.characterName} (${agent.name}) ===`);
  if (agent.role_description || agent.roleDescription) {
    sysParts.push(agent.role_description || agent.roleDescription);
  }
  if (agent.system_prompt || agent.systemPrompt) {
    sysParts.push(agent.system_prompt || agent.systemPrompt);
  }

  // 2. Business Profile & Brand Instructions (User Customization)
  if (businessProfile) {
    const brandLines = ['=== BRAND GUIDELINES & VOICE ==='];
    brandLines.push(`- Brand: ${businessProfile.brand_name || businessProfile.brandName} (Industry: ${businessProfile.industry || 'General'})`);
    
    if (businessProfile.target_audience || businessProfile.targetAudience) {
      brandLines.push(`- Target Audience: ${businessProfile.target_audience || businessProfile.targetAudience}`);
    }
    if (businessProfile.tone_and_voice || businessProfile.toneAndVoice) {
      brandLines.push(`- Tone & Voice: ${businessProfile.tone_and_voice || businessProfile.toneAndVoice}`);
    }
    if (businessProfile.preferred_language || businessProfile.preferredLanguage) {
      brandLines.push(`- Preferred Language: ${businessProfile.preferred_language || businessProfile.preferredLanguage}`);
    }
    if (businessProfile.cta_style || businessProfile.ctaStyle) {
      brandLines.push(`- Call To Action (CTA) Style: ${businessProfile.cta_style || businessProfile.ctaStyle}`);
    }

    const doRules = businessProfile.do_rules || businessProfile.doRules;
    if (Array.isArray(doRules) && doRules.length > 0) {
      brandLines.push('- MANDATORY DO RULES:');
      doRules.forEach(r => brandLines.push(`  * ${r}`));
    }

    const dontRules = businessProfile.dont_rules || businessProfile.dontRules;
    if (Array.isArray(dontRules) && dontRules.length > 0) {
      brandLines.push('- STRICT DON\'T RULES:');
      dontRules.forEach(r => brandLines.push(`  * ${r}`));
    }

    const prohibitedClaims = businessProfile.prohibited_claims || businessProfile.prohibitedClaims;
    if (Array.isArray(prohibitedClaims) && prohibitedClaims.length > 0) {
      brandLines.push('- PROHIBITED CLAIMS (NEVER CLAIM):');
      prohibitedClaims.forEach(r => brandLines.push(`  * ${r}`));
    }

    if (businessProfile.custom_instructions || businessProfile.customInstructions) {
      brandLines.push(`- Custom Instructions: ${businessProfile.custom_instructions || businessProfile.customInstructions}`);
    }

    sysParts.push(brandLines.join('\n'));
  }

  // 3. Relevant Knowledge & System Rules (Token-conscious selection)
  if (knowledgeItems.length > 0) {
    const knowLines = ['=== APPLICABLE KNOWLEDGE & CONSTRAINTS ==='];
    knowledgeItems.forEach(k => {
      knowLines.push(`[${k.title}]: ${k.content}`);
    });
    sysParts.push(knowLines.join('\n'));
  }

  // 4. Execution Tools & Permissions
  if (allowedTools.length > 0) {
    sysParts.push(`=== ALLOWED EXECUTION TOOLS ===\n${allowedTools.join(', ')}`);
  }

  // 5. Build User Prompt with Task & Previous Results
  const userParts = [`TASK: ${taskTitle}\n`];

  if (Object.keys(taskInput).length > 0) {
    userParts.push(`TASK INPUT DATA:\n${JSON.stringify(taskInput, null, 2)}\n`);
  }

  if (Object.keys(previousResults).length > 0) {
    userParts.push(`UPSTREAM AGENT RESULTS:\n${JSON.stringify(previousResults, null, 2)}\n`);
  }

  userParts.push('Please produce a complete, high-quality, professional structured output adhering strictly to all brand constraints above.');

  return {
    systemPrompt: sysParts.join('\n\n'),
    userPrompt: userParts.join('\n'),
  };
}
