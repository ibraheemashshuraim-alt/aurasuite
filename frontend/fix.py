import sys

with open('components/AgentTown.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if ".channel(\x07gent_town_sync_)" in line:
        new_lines.append("      .channel(gent_town_sync_)\n")
    elif "filter: organization_id=eq. }," in line:
        new_lines.append("        { event: '*', schema: 'public', table: 'engine_tasks', filter: organization_id=eq. },\n")
    else:
        new_lines.append(line)

with open('components/AgentTown.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Fixed!")
