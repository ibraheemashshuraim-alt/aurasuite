import sys

with open('components/AgentTown.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('AgentTown_replacement.txt', 'r', encoding='utf-8') as f:
    replacement = f.read()

# find line 51 to 120
start = -1
end = -1
for i, line in enumerate(lines):
    if "useEffect(() => {" in line and "Realtime Supabase Subscription" in lines[i-1]:
        start = i - 1
    if start != -1 and "}, [currentUser?.organization_id]);" in line:
        end = i
        break

if start != -1 and end != -1:
    new_lines = lines[:start] + [replacement + "\n"] + lines[end+1:]
    with open('components/AgentTown.js', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Replaced!")
else:
    print("Not found!")
