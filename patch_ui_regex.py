import sys
import re

with open('frontend/components/AgentTown.js', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"(const handleAssistantSubmit = async \(e\) => {[^}]*?setActiveTaskBanner[^;]*;)"
replacement = r"""\1

    // PHASE 4: Campaign Routing
    if (promptText.toLowerCase().startsWith('/campaign')) {
       const campaignTopic = promptText.replace(/\/campaign/i, '').trim() || 'New Brand Launch';
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

content = re.sub(pattern, replacement, content, count=1)

with open('frontend/components/AgentTown.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("AgentTown UI updated using regex!")
