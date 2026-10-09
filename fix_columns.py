import sys

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple targeted replacements
    if 'tasks/route.js' in filepath:
        content = content.replace("agent_id: finalAgentId,", "assigned_agent_id: finalAgentId,")
    elif 'campaign/route.js' in filepath:
        content = content.replace("agent_id: agentIds['Saima']", "assigned_agent_id: agentIds['Saima']")
        content = content.replace("agent_id: agentIds['Dani']", "assigned_agent_id: agentIds['Dani']")
        content = content.replace("agent_id: agentIds['Mianzi']", "assigned_agent_id: agentIds['Mianzi']")
        content = content.replace("agent_id: agentIds['Zohaib']", "assigned_agent_id: agentIds['Zohaib']")
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_file('frontend/app/api/tasks/route.js')
fix_file('frontend/app/api/engine/campaign/route.js')
