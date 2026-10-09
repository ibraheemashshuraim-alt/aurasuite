import sys
import re

with open('frontend/lib/ai/engine/executor.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject System Prompt Capabilities
system_prompt_old = """    const systemPrompt = [
      'You are ' + agent.name + ' (' + agent.character_name + ').',
      'Role: ' + agent.role_description,
      agent.system_prompt,
      '',
      '--- GLOBAL INSTRUCTIONS ---',
      'AuraSuite is a professional platform. Keep responses helpful and aligned with the brand.',
      '',
      '--- YOUR MEMORY ---',
      memoryStrings.length > 0 ? memoryStrings.join('\\n') : 'No relevant memory yet.'
    ].join('\\n');"""

system_prompt_new = """    const systemPrompt = [
      'You are ' + agent.name + ' (' + agent.character_name + ').',
      'Role: ' + agent.role_description,
      agent.system_prompt,
      '',
      '--- CAPABILITIES & COMPUTER CONTROL ---',
      'You have access to a real web browser to complete tasks. If a task requires visiting a website, reading a webpage, or clicking/typing, YOU MUST OUTPUT ONLY A RAW JSON OBJECT with an "actions" array. DO NOT output markdown or conversational text if you output JSON.',
      'Supported actions:',
      '- { "type": "open_url", "target": "https://..." }',
      '- { "type": "read_screen" }',
      '- { "type": "click", "target": "css_selector" }',
      '- { "type": "type", "target": "css_selector", "value": "text_to_type" }',
      '- { "type": "press_key", "value": "Enter" }',
      '- { "type": "wait", "value": "2000" }',
      '- { "type": "screenshot" }',
      '',
      'Example JSON output:',
      '{',
      '  "actions": [',
      '    { "type": "open_url", "target": "https://en.wikipedia.org/wiki/Main_Page" },',
      '    { "type": "type", "target": "#searchInput", "value": "Artificial Intelligence" },',
      '    { "type": "press_key", "value": "Enter" },',
      '    { "type": "wait", "value": "3000" },',
      '    { "type": "read_screen" }',
      '  ]',
      '}',
      'If the task does NOT require web browsing, simply output your normal conversational response.',
      '',
      '--- GLOBAL INSTRUCTIONS ---',
      'AuraSuite is a professional platform. Keep responses helpful and aligned with the brand.',
      '',
      '--- YOUR MEMORY ---',
      memoryStrings.length > 0 ? memoryStrings.join('\\n') : 'No relevant memory yet.'
    ].join('\\n');"""

if system_prompt_old in content:
    content = content.replace(system_prompt_old, system_prompt_new)
else:
    print("Could not find system prompt block to replace.")

# 2. Fix JSON Markdown Parsing
json_parse_old = """    let actionPlanResult = null;
    let isActionPlan = false;
    try {
      const parsed = JSON.parse(resultText);
      if (parsed && Array.isArray(parsed.actions)) {
        isActionPlan = true;
      }
    } catch (e) {
      // Not JSON, continue as normal AI task
    }"""

json_parse_new = """    let actionPlanResult = null;
    let isActionPlan = false;
    
    let cleanJsonText = resultText.trim();
    if (cleanJsonText.startsWith('```json')) {
       cleanJsonText = cleanJsonText.replace(/^```json\\n?/, '');
       cleanJsonText = cleanJsonText.replace(/```$/, '');
       cleanJsonText = cleanJsonText.trim();
    } else if (cleanJsonText.startsWith('```')) {
       cleanJsonText = cleanJsonText.replace(/^```\\n?/, '');
       cleanJsonText = cleanJsonText.replace(/```$/, '');
       cleanJsonText = cleanJsonText.trim();
    }

    try {
      const parsed = JSON.parse(cleanJsonText);
      if (parsed && Array.isArray(parsed.actions)) {
        isActionPlan = true;
        resultText = cleanJsonText;
      }
    } catch (e) {
      // Not JSON, continue as normal AI task
    }"""

if json_parse_old in content:
    content = content.replace(json_parse_old, json_parse_new)
else:
    print("Could not find json parsing block to replace.")

with open('frontend/lib/ai/engine/executor.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated executor.js for Phase 3C Brain!")
