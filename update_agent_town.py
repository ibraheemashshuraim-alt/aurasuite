import sys

with open('frontend/components/AgentTown.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "'RUNNING': 'thinking',", 
    "'RUNNING': 'thinking',\n        'ACTION_REQUIRED': 'thinking',\n        'EXECUTING': 'working',"
)

content = content.replace(
    "['PENDING', 'RUNNING', 'VERIFYING'].includes(task.status)",
    "['PENDING', 'RUNNING', 'ACTION_REQUIRED', 'EXECUTING', 'VERIFYING'].includes(task.status)"
)

content = content.replace(
    "thought: task.status === 'VERIFYING' ? 'Verifying output...' : 'Task: ' + task.title",
    "thought: task.status === 'VERIFYING' ? 'Verifying output...' : task.status === 'ACTION_REQUIRED' ? 'Action Required!' : task.status === 'EXECUTING' ? 'Executing Actions...' : 'Task: ' + task.title"
)

with open('frontend/components/AgentTown.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("AgentTown Updated")
