import re

filepath = 'frontend/app/dashboard/page.js'
with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add playSoundEffect at the top level of the component
pattern_state = r"const \[activeChat, setActiveChat\] = useState\('group'\);"
replacement_state = """const playSoundEffect = (type) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    if (type === 'incoming_msg') {
      const play = (f, t, d) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = f;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + d);
      };
      play(783.99, now, 0.15); 
      play(1046.50, now + 0.1, 0.3); 
    } else if (type === 'outgoing_msg') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'mic_start') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.2);
    }
  };
  const [activeChat, setActiveChat] = useState('group');"""
code = re.sub(pattern_state, replacement_state, code)

# 2. Add useEffect for chat state
pattern_effect = r"useEffect\(\(\) => \{ const saved = localStorage.getItem\('aura_admin_tab'\); if \(saved\) setActiveTab\(saved\); \}, \[\]\);"
replacement_effect = """useEffect(() => { const saved = localStorage.getItem('aura_admin_tab'); if (saved) setActiveTab(saved); }, []);
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

# 3. Update openGroupChat, openDmChat, and close chat button to save state
pattern_group = r"const openGroupChat = \(\) => \{\s*setActiveChat\('group'\);\s*setActiveDmUser\(null\);\s*setIsChatClosed\(false\);"
replacement_group = """const openGroupChat = () => {
    setActiveChat('group');
    setActiveDmUser(null);
    setIsChatClosed(false);
    localStorage.setItem('aura_chat_state', JSON.stringify({ type: 'group' }));"""
code = re.sub(pattern_group, replacement_group, code)

pattern_dm = r"const openDmChat = \(user\) => \{\s*const key = getDmKey\(user\.id\);\s*setActiveChat\('dm'\);\s*setActiveDmUser\(user\);\s*setIsChatClosed\(false\);"
replacement_dm = """const openDmChat = (user) => {
    const key = getDmKey(user.id);
    setActiveChat('dm');
    setActiveDmUser(user);
    setIsChatClosed(false);
    localStorage.setItem('aura_chat_state', JSON.stringify({ type: 'dm', user }));"""
code = re.sub(pattern_dm, replacement_dm, code)

pattern_close = r"setIsChatClosed\(true\); setShowChatMenu\(false\);"
replacement_close = "setIsChatClosed(true); setShowChatMenu(false); localStorage.setItem('aura_chat_state', JSON.stringify({ type: 'closed' }));"
code = re.sub(pattern_close, replacement_close, code)

# 4. Add sounds
# a. Outgoing: handleChatSubmit
# The user types a message and clicks send, or audio sends
pattern_submit = r"if \(activeChat === 'group'\) \{\s*const msg = \{ id: msgId, from: currentUser\.id, fromName: currentUser\.full_name, text: currentChatInput, time: msgTime, type: 'chat', attachmentUrl: null, audioUrl: audioUrl, reactions: \{\} \};\s*setGroupMessages\(prev => \[...prev, msg\]\);"
replacement_submit = """if (activeChat === 'group') {
          playSoundEffect('outgoing_msg');
          const msg = { id: msgId, from: currentUser.id, fromName: currentUser.full_name, text: currentChatInput, time: msgTime, type: 'chat', attachmentUrl: null, audioUrl: audioUrl, reactions: {} };
          setGroupMessages(prev => [...prev, msg]);"""
code = re.sub(pattern_submit, replacement_submit, code)

pattern_dm_submit = r"\} else if \(activeChat === 'dm' && activeDmUser\) \{ \s*const key = \[currentUser\?\.id, activeDmUser\?\.id\]\.sort\(\)\.join\('_'\); "
replacement_dm_submit = """} else if (activeChat === 'dm' && activeDmUser) { 
          playSoundEffect('outgoing_msg');
          const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); """
code = re.sub(pattern_dm_submit, replacement_dm_submit, code)

# b. Mic Start
pattern_mic = r"audioRecorderRef\.current\.start\(\);\s*setIsRecordingAudio\(true\);"
replacement_mic = """audioRecorderRef.current.start();
      setIsRecordingAudio(true);
      playSoundEffect('mic_start');"""
code = re.sub(pattern_mic, replacement_mic, code)

# c. Incoming Message: supabase insert triggers
# In the `supabase.channel('public:group_messages')` listener:
pattern_in_group = r"if \(payload\.new\.from_id !== currentUserRef\.current\?\.id\) \{\s*setGroupMessages\(prev => \{"
replacement_in_group = """if (payload.new.from_id !== currentUserRef.current?.id) {
                playSoundEffect('incoming_msg');
                setGroupMessages(prev => {"""
code = re.sub(pattern_in_group, replacement_in_group, code)

pattern_in_dm = r"if \(payload\.new\.from_id !== currentUserRef\.current\?\.id\) \{\s*setDmThreads\(prev => \{"
replacement_in_dm = """if (payload.new.from_id !== currentUserRef.current?.id) {
                playSoundEffect('incoming_msg');
                setDmThreads(prev => {"""
code = re.sub(pattern_in_dm, replacement_in_dm, code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated dashboard/page.js successfully")
