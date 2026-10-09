import sys

with open('frontend/components/AgentTown.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add a check for /campaign
submit_logic_old = """    const handleAssistantSubmit = async (e) => {
      e?.preventDefault();
      if (isDispatching) return;
  
      const promptText = voiceInput.trim() || 'Analyze market trends and draft initial growth strategy';
      setVoiceInput('');
      setIsDispatching(true);
      setActiveTaskBanner(`Dispatching: "${promptText.slice(0, 42)}..." to Orchestrator...`);"""

submit_logic_new = """    const handleAssistantSubmit = async (e) => {
      e?.preventDefault();
      if (isDispatching) return;
  
      const promptText = voiceInput.trim() || 'Analyze market trends and draft initial growth strategy';
      setVoiceInput('');
      setIsDispatching(true);
      setActiveTaskBanner(`Dispatching: "${promptText.slice(0, 42)}..." to Orchestrator...`);

      // PHASE 4: Campaign Routing
      if (promptText.toLowerCase().startsWith('/campaign')) {
         const campaignTopic = promptText.replace(/\\/campaign/i, '').trim() || 'New Brand Launch';
         try {
           const orgId = currentUser?.organization_id || 'org-aurasuite-superadmin';
           const res = await fetch('/api/engine/campaign', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ prompt: campaignTopic, organization_id: orgId, created_by: currentUser?.id })
           });
           const data = await res.json();
           if (data.success) {
             setActiveTaskBanner('Campaign Started! The 5-Agent Swarm is now active.');
             setIsDispatching(false);
             return; // Stop standard execution
           } else {
             throw new Error(data.error);
           }
         } catch(err) {
           console.error('Campaign start failed:', err);
           setActiveTaskBanner(`Campaign Error: ${err.message}`);
           setIsDispatching(false);
           return;
         }
      }
"""

if submit_logic_old in content:
    content = content.replace(submit_logic_old, submit_logic_new)
else:
    print("Could not find submit logic to patch.")

with open('frontend/components/AgentTown.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("AgentTown UI updated with /campaign command!")
