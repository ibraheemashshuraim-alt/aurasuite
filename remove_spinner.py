import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Modify handleSendMessage to ONLY set isSendingChat if files/audio are present
new_func = """    const handleSendMessage = async (e) => {
      e?.preventDefault();
      if (isRecordingAudio) {
        audioShouldSendRef.current = true;
        stopRecording();
        return;
      }
      const currentChatInput = chatInput;
      const currentAttachmentFiles = attachmentFiles;
      const currentAudioBlob = audioBlob;
      
      if (!currentChatInput.trim() && currentAttachmentFiles.length === 0 && !currentAudioBlob) return;
      
      setChatInput('');
      setAttachmentFiles([]);
      setAttachmentSource(null);
      setAudioBlob(null);

      const needsSpinner = currentAttachmentFiles.length > 0 || currentAudioBlob;
      if (needsSpinner) {
        setIsSendingChat(true);
        setTimeout(() => setIsSendingChat(false), 2000);
      }

      try {
"""
d = d.replace("""    const handleSendMessage = async (e) => {
      e?.preventDefault();
      if (isRecordingAudio) {
        audioShouldSendRef.current = true;
        stopRecording();
        return;
      }
      const currentChatInput = chatInput;
      const currentAttachmentFiles = attachmentFiles;
      const currentAudioBlob = audioBlob;
      
      if (!currentChatInput.trim() && currentAttachmentFiles.length === 0 && !currentAudioBlob) return;
      
      setChatInput('');
      setAttachmentFiles([]);
      setAttachmentSource(null);
      setAudioBlob(null);
      setIsSendingChat(true);
      setTimeout(() => setIsSendingChat(false), 2000);
  
      try {""", new_func)

# And update the finally block
d = d.replace("} finally { setIsSendingChat(false); setTimeout(() => setIsSendingChat(false), 3000); }", "} finally { if (needsSpinner) { setIsSendingChat(false); } }")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Removed spinner entirely for text chat")
