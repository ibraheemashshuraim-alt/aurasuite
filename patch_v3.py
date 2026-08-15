import re

def rewrite_file(filepath):
    print(f"Rewriting {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add states if missing
    if 'const [isDictating' not in content:
        content = content.replace('const [audioBlob, setAudioBlob] = useState(null);',
                                  'const [audioBlob, setAudioBlob] = useState(null);\n  const [isDictating, setIsDictating] = useState(false);\n  const recognitionRef = useRef(null);\n  const [reactionModalData, setReactionModalData] = useState(null);')

    if 'const audioDiscardRef = useRef(false);' not in content:
        content = content.replace('const audioShouldSendRef = useRef(false);',
                                  'const audioShouldSendRef = useRef(false);\n  const audioDiscardRef = useRef(false);')

    if 'const audioChunksRef = useRef([]);' not in content:
        content = content.replace('const audioShouldSendRef = useRef(false);',
                                  'const audioShouldSendRef = useRef(false);\n  const audioChunksRef = useRef([]);')

    # Fix imports
    if 'Type' not in content and 'import { Search' in content:
        content = re.sub(r'import { (.*?) } from \'lucide-react\';', r"import { \1, Type } from 'lucide-react';", content)

    # Completely replace stopRecording
    stop_pattern = re.compile(r'const stopRecording = \(\) => \{.*?\};', re.DOTALL)
    new_stop = '''const stopRecording = () => {
    if (audioRecorderRef.current && isRecordingAudio) {
      audioRecorderRef.current.stop();
      if (audioRecorderRef.current.stream) {
        audioRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecordingAudio(false);
    }
  };'''
    if stop_pattern.search(content):
        content = stop_pattern.sub(new_stop, content)

    # Completely replace startRecording
    start_pattern = re.compile(r'const startRecording = async \(\) => \{.*?\} catch \(err\) \{.*?\}\s*\};', re.DOTALL)
    new_start = '''const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRecorderRef.current = new MediaRecorder(stream);
      audioRecorderRef.current.stream = stream;
      audioChunksRef.current = [];
      
      audioRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      audioRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioRecorderRef.current.stream) {
            audioRecorderRef.current.stream.getTracks().forEach(track => track.stop());
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

    # Add toggleDictation
    dict_code = '''const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech to text is not supported in this browser. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ur-PK';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
         setChatInput(prev => prev + ' ' + finalTranscript.trim());
      }
    };
    
    recognition.onerror = (e) => {
      console.error(e);
      setIsDictating(false);
    };
    recognition.onend = () => { setIsDictating(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsDictating(true);
  };'''
    if 'const toggleDictation' not in content:
        content = content.replace(new_start, dict_code + '\n\n  ' + new_start)

    # UI: Camera capture="environment"
    content = content.replace('capture="environment"', 'capture="camera"')

    # UI: Dictation button correctly placed next to the Mic button inside the chat input form.
    # The start recording button:
    mic_btn_target = '<button type="button" onClick={() => { audioShouldSendRef.current = false; startRecording(); }}'
    dict_btn_ui = '''<button type="button" onClick={toggleDictation} className={`p-2.5 rounded-full transition-colors ${isDictating ? 'text-green-400 bg-green-900/30 animate-pulse' : 'bg-purple-900/30 text-purple-300 hover:text-green-400 hover:bg-green-900/30'}`} title="Speech to Text">
                            <Type size={18} />
                          </button>\n                          '''
    if dict_btn_ui not in content:
        content = content.replace(mic_btn_target, dict_btn_ui + mic_btn_target)

    # Reaction click opens modal instead of toggling
    old_reaction_click = re.compile(r'onClick=\{\(\) => toggleReaction\(msg\.id, emoji\)\}\s*title=\{.*?\}')
    new_reaction_click = 'onClick={() => setReactionModalData({ msgId: msg.id, reactions: msg.reactions || {} })} title="View Reactions"'
    content = old_reaction_click.sub(new_reaction_click, content)

    # Reaction Modal UI
    reaction_modal = '''      {reactionModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setReactionModalData(null)}>
          <div className="bg-[#11081c] border border-purple-500/30 rounded-xl w-80 max-h-[80vh] overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">Reactions</h3>
              <button onClick={() => setReactionModalData(null)} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="space-y-3">
              {Object.entries(reactionModalData.reactions).map(([emoji, users]) => 
                  users.map(uid => {
                    const user = orgUsers?.find(u => u.id === uid);
                    const isMe = uid === currentUser?.id;
                    return (
                      <div key={`${emoji}-${uid}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center text-xl">
                            {emoji}
                          </div>
                          <span className="text-sm text-gray-200">{isMe ? 'You' : (user?.full_name || 'Unknown')}</span>
                        </div>
                        {isMe && (
                          <button onClick={() => { toggleReaction(reactionModalData.msgId, emoji); setReactionModalData(null); }} className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded px-2 py-1 transition-colors">
                            Tap to remove
                          </button>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}'''
    if 'reactionModalData && (' not in content:
        idx = content.rfind('</div>')
        if idx != -1:
            content = content[:idx] + reaction_modal + '\n    </div>' + content[idx+6:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

rewrite_file('c:/Users/abdullah/OneDrive/Desktop/AuraSuite/frontend/app/dashboard/page.js')
rewrite_file('c:/Users/abdullah/OneDrive/Desktop/AuraSuite/frontend/app/login/page.js')
print("Patch V3 Done!")
