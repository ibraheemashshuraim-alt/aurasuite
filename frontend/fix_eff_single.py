import sys

block = """
  // Phase 2C Realtime Supabase Subscription for Engine Tasks
  useEffect(() => {
    if (!currentUser?.organization_id) return;

    loadTasks(); // Initial load

    const channel = supabase
      .channel(`agent_town_sync_${currentUser.organization_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'engine_tasks', filter: `organization_id=eq.${currentUser.organization_id}` },
        () => {
          loadTasks(); // reload tasks on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.organization_id]);
"""

with open('components/AgentTown.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = -1
end = -1
for i, line in enumerate(lines):
    if "useEffect(() => {" in line and "if (!currentUser?.organization_id) return;" in lines[i+1]:
        start = i - 1
    if start != -1 and "}, [currentUser?.organization_id]);" in line:
        end = i
        break

if start != -1 and end != -1:
    new_lines = lines[:start] + [block + "\n"] + lines[end+1:]
    with open('components/AgentTown.js', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Replaced properly!")
else:
    print("Not found!")
