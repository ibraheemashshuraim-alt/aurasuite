import sys

with open('components/AgentTown.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "href={/api/engine/logs?taskId=}" in line:
        new_lines.append(line.replace("href={/api/engine/logs?taskId=}", "href={/api/engine/logs?taskId=}"))
    elif "text-black':'text-white'}}" in line:
        new_lines.append("                      <div className={	ext-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider  }>\n")
    else:
        new_lines.append(line)

with open('components/AgentTown.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Fixed!")
