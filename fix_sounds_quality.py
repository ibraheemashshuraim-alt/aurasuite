import re

files = ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']

replacement = """const playSoundEffect = (type) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    if (type === 'incoming_msg') {
      const playNote = (freq, t, d) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(freq, t);
        
        // Mallet click
        const click = ctx.createOscillator();
        const clickGain = ctx.createGain();
        click.type = 'square';
        click.frequency.setValueAtTime(freq * 2, t);
        clickGain.gain.setValueAtTime(0, t);
        clickGain.gain.linearRampToValueAtTime(0.05, t + 0.005);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        click.connect(clickGain); clickGain.connect(ctx.destination);
        click.start(t); click.stop(t + 0.05);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + d);
      };
      playNote(880, now, 0.3); // A5
      playNote(1108.73, now + 0.12, 0.5); // C#6
    } else if (type === 'outgoing_msg') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle'; // Woodblock feel
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.05); // sharp drop creates "tick"
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.06);
    } else if (type === 'mic_start') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1); // Sweeping up
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.1);
    }
  };"""

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # Find the old playSoundEffect block
    pattern = r"const playSoundEffect = \(type\) => \{[\s\S]*?\}\n  \};\n"
    code = re.sub(pattern, replacement + "\n", code)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

print("Updated playSoundEffect with highly realistic WhatsApp sounds!")
