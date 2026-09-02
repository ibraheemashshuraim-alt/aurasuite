import re

files = ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Update ringtone logic
    # Find startIncomingRingtone and stopIncomingRingtone
    pattern_incoming = r"const stopIncomingRingtone = \(\) => \{[\s\S]*?ringtoneRef\.current\.timer = setInterval\(playTone, 1300\);\n\s*\};"
    
    replacement_incoming = """const stopIncomingRingtone = () => {
    if (ringtoneRef.current.timer) clearInterval(ringtoneRef.current.timer);
    ringtoneRef.current.timer = null;
    try { ringtoneRef.current.ctx?.close?.(); } catch(e){}
    ringtoneRef.current.ctx = null;
  };

  const startIncomingRingtone = () => {
    stopIncomingRingtone();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ringtoneRef.current.ctx = ctx;
    
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
      osc.start(startTime); osc2.start(startTime);
      osc.stop(startTime + duration); osc2.stop(startTime + duration);
    };

    const playTone = () => {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      playNote(440, now, 0.5);
      playNote(523.25, now + 0.15, 0.5);
      playNote(659.25, now + 0.3, 0.5);
      playNote(880, now + 0.45, 0.8);
      playNote(440, now + 1.2, 0.5);
      playNote(523.25, now + 1.35, 0.5);
      playNote(659.25, now + 1.5, 0.5);
      playNote(880, now + 1.65, 0.8);
    };
    playTone();
    ringtoneRef.current.timer = setInterval(playTone, 3500);
  };
  
  const dialingToneRef = useRef({ timer: null, ctx: null });
  const stopDialingTone = () => {
    if (dialingToneRef.current?.timer) clearInterval(dialingToneRef.current.timer);
    try { dialingToneRef.current?.ctx?.close?.(); } catch(e){}
    dialingToneRef.current = { timer: null, ctx: null };
  };
  const startDialingTone = () => {
    stopDialingTone();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    dialingToneRef.current.ctx = ctx;
    const playTuun = () => {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine'; osc2.type = 'sine';
      osc1.frequency.value = 400; osc2.frequency.value = 425;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.setValueAtTime(0.15, now + 1.0);
      gain.gain.linearRampToValueAtTime(0, now + 1.1);
      osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
      osc1.start(now); osc2.start(now);
      osc1.stop(now + 1.2); osc2.stop(now + 1.2);
    };
    playTuun();
    dialingToneRef.current.timer = setInterval(playTuun, 4000);
  };"""
    code = re.sub(pattern_incoming, replacement_incoming, code)

    # 2. Add `const dialingToneRef = useRef(...)` inside component if not added properly.
    # We added it just below `stopIncomingRingtone`. But wait! Hooks must be inside the component top-level.
    # `stopIncomingRingtone` is inside the component. BUT wait! `useRef` cannot be inside conditionally, and cannot be just anywhere.
    # It must be grouped with other hooks.
    # Let's fix that.
    
    # We will remove `const dialingToneRef = useRef` from the replacement and insert it at the top of the component.
    replacement_incoming = replacement_incoming.replace("const dialingToneRef = useRef({ timer: null, ctx: null });\n  ", "")
    code = re.sub(pattern_incoming, replacement_incoming, code)
    
    # Insert dialingToneRef
    pattern_ref = r"const ringtoneRef = useRef\(\{ timer: null, ctx: null \}\);"
    replacement_ref = """const ringtoneRef = useRef({ timer: null, ctx: null });
  const dialingToneRef = useRef({ timer: null, ctx: null });"""
    code = re.sub(pattern_ref, replacement_ref, code)

    # 3. Call stopDialingTone() on call-ended and call-accepted
    pattern_ended = r"stopIncomingRingtone\(\);\s*endChatCall\(false\);"
    replacement_ended = """stopIncomingRingtone();
            stopDialingTone();
            endChatCall(false);"""
    code = re.sub(pattern_ended, replacement_ended, code)

    pattern_accepted = r"chatCallAnsweredRef\.current = true;\s*chatCallStartedAtRef\.current = chatCallStartedAtRef\.current \|\| Date\.now\(\);"
    replacement_accepted = """stopDialingTone();
            chatCallAnsweredRef.current = true;
            chatCallStartedAtRef.current = chatCallStartedAtRef.current || Date.now();"""
    code = re.sub(pattern_accepted, replacement_accepted, code)

    pattern_end_func = r"const endChatCall = \(notify = true\) => \{\s*stopIncomingRingtone\(\);"
    replacement_end_func = """const endChatCall = (notify = true) => {
    stopIncomingRingtone();
    stopDialingTone();"""
    code = re.sub(pattern_end_func, replacement_end_func, code)

    # 4. Call startDialingTone() in joinChatCall if amCaller
    # Find:
    # const amCaller = call.callerId === me;
    # setChatCall({ ...call, status: amCaller ? (call.status || 'calling') : 'connected' });
    pattern_join = r"const amCaller = call\.callerId === me;\s*setChatCall\(\{ \.\.\.call, status: amCaller \? \(call\.status \|\| 'calling'\) : 'connected' \}\);"
    replacement_join = """const amCaller = call.callerId === me;
    setChatCall({ ...call, status: amCaller ? (call.status || 'calling') : 'connected' });
    if (amCaller && (!call.status || call.status === 'calling')) {
      startDialingTone();
    }"""
    code = re.sub(pattern_join, replacement_join, code)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

print("Audio logic updated successfully.")
