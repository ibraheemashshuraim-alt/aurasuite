import sys
import re

filepath = 'frontend/app/dashboard/page.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'saveBYOKKey' not in content:
    content = content.replace("import { supabase } from '../lib/supabase';", 
                              "import { supabase } from '../lib/supabase';\nimport { saveBYOKKey } from '../lib/agentClient';")

# 2. Add state for geminiKey
if 'const [geminiKey, setGeminiKey]' not in content:
    content = content.replace("const [passwordChangeNew, setPasswordChangeNew] = useState('');",
                              "const [passwordChangeNew, setPasswordChangeNew] = useState('');\n  const [geminiKey, setGeminiKey] = useState('');")

# 3. Add handleSaveGeminiKey
handle_save = """  const handleSaveGeminiKey = async () => {
    try {
      if (!geminiKey) return alert('Enter API key');
      await saveBYOKKey({
        orgId: activeOrg.id,
        providerName: 'gemini',
        apiKey: geminiKey,
        defaultModel: 'gemini-1.5-pro',
        baseUrl: null
      });
      addNotification('Gemini API Key saved!', 'success');
      setGeminiKey('');
    } catch(err) {
      addNotification(err.message, 'error');
    }
  };"""

if 'handleSaveGeminiKey' not in content:
    content = content.replace("const handleChangePasswordSettings", handle_save + "\n\n  const handleChangePasswordSettings")

# 4. Add UI section in Settings Tab
settings_ui = """                  <div className="mt-8 pt-6 border-t border-purple-500/10">
                    <h4 className="text-sm font-bold text-white mb-4">AI Provider Settings</h4>
                    <div className="space-y-3">
                      <label className="text-xs text-purple-300 block mb-1">Gemini API Key (Required for Agent Town)</label>
                      <input type="password" placeholder="AIzaSy..." value={geminiKey} onChange={e => setGeminiKey(e.target.value)}
                        className="w-full bg-[#11081c] border border-purple-500/25 rounded-xl p-2 text-xs text-white focus:outline-none" />
                      <button onClick={handleSaveGeminiKey} className="px-5 py-2 rounded-xl accent-gradient text-xs font-bold text-white glow-btn">
                        Save API Key
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-purple-500/10">
                    <h4 className="text-sm font-bold text-white mb-4">Security Settings</h4>"""

content = content.replace("""                  <div className="mt-8 pt-6 border-t border-purple-500/10">
                    <h4 className="text-sm font-bold text-white mb-4">Security Settings</h4>""", settings_ui)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated dashboard with API key UI!")
