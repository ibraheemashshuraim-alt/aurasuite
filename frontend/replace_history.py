import sys

with open('components/AgentTown.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('AgentTown_history.txt', 'r', encoding='utf-8') as f:
    replacement = f.read()

start = -1
end = -1
for i, line in enumerate(lines):
    if "engineTasks.map(task => (" in line:
        start = i
    if start != -1 and "))" in line and i > start:
        end = i
        break

if start != -1 and end != -1:
    new_lines = lines[:start] + [replacement + "\n"] + lines[end+1:]
    with open('components/AgentTown.js', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Replaced!")
else:
    print("Not found!", start, end)
