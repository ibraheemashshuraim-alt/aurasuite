import re

filepath = 'frontend/app/login/page.js'
with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# Add the useEffect
pattern_effect = r"useEffect\(\(\) => \{ const saved = sessionStorage.getItem\('aura_worker_tab'\) \|\| \(currentUser\?\.role === 'worker' \? 'dashboard' : null\); if \(saved\) setActiveTab\(saved\); \}, \[\]\);"
replacement_effect = """useEffect(() => { const saved = sessionStorage.getItem('aura_worker_tab') || (currentUser?.role === 'worker' ? 'dashboard' : null); if (saved) setActiveTab(saved); }, []);
  useEffect(() => {
    const savedChat = localStorage.getItem('aura_chat_state');
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        if (parsed.type === 'closed') {
          setIsChatClosed(true);
        } else if (parsed.type === 'group') {
          setIsChatClosed(false); setActiveChat('group'); setActiveDmUser(null);
        } else if (parsed.type === 'dm' && parsed.user) {
          setIsChatClosed(false); setActiveChat('dm'); setActiveDmUser(parsed.user);
        }
      } catch (e) {}
    }
  }, []);"""

code = re.sub(pattern_effect, replacement_effect, code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("Injected useEffect into login/page.js")
