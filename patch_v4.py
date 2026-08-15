import re

def rewrite_file(filepath):
    print(f"Rewriting {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add mediaStreamRef if missing
    if 'const mediaStreamRef = useRef(null);' not in content:
        content = content.replace('const audioChunksRef = useRef([]);',
                                  'const audioChunksRef = useRef([]);\n  const mediaStreamRef = useRef(null);')

    # 2. Fix startRecording
    start_pattern = re.compile(r'const startRecording = async \(\) => \{.*?\} catch \(err\) \{.*?\}\s*\};', re.DOTALL)
    new_start = '''const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      audioRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      audioRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        
        if (audioDiscardRef.current) {
          audioDiscardRef.current = false;
          setAudioBlob(null);
          return;
        }
        
        if (audioShouldSendRef.current) {
          audioShouldSendRef.current = false;
          await handleDirectAudioSend(blob);
        } else {
          setAudioBlob(blob);
        }
      };
      
      audioRecorderRef.current.start();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(`Microphone error: ${err.name}. If 'NotReadableError', close other tabs using the mic!`);
    }
  };'''
    if start_pattern.search(content):
        content = start_pattern.sub(new_start, content)

    # 3. Fix stopRecording
    stop_pattern = re.compile(r'const stopRecording = \(\) => \{.*?\};', re.DOTALL)
    new_stop = '''const stopRecording = () => {
    if (audioRecorderRef.current && isRecordingAudio) {
      audioRecorderRef.current.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setIsRecordingAudio(false);
    }
  };'''
    if stop_pattern.search(content):
        content = stop_pattern.sub(new_stop, content)

    # 4. Fix Reaction click mapping
    # Search for onClick={() => handleReactMessage(msg, emoji)}
    # or onClick={() => toggleReaction(msg.id, emoji)}
    old_click = re.compile(r'onClick=\{\(\) => handleReactMessage\(msg, emoji\)\}')
    new_click = 'onClick={() => setReactionModalData({ msgId: msg.id, reactions: msg.reactions || {} })} title="View Reactions"'
    content = old_click.sub(new_click, content)
    
    # Just in case some places use toggleReaction
    old_click2 = re.compile(r'onClick=\{\(\) => toggleReaction\(msg\.id, emoji\)\}')
    content = old_click2.sub(new_click, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

rewrite_file('c:/Users/abdullah/OneDrive/Desktop/AuraSuite/frontend/app/dashboard/page.js')
rewrite_file('c:/Users/abdullah/OneDrive/Desktop/AuraSuite/frontend/app/login/page.js')
print("Patch V4 Done!")
