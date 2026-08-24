import re

d = open('frontend/app/dashboard/page.js', 'r', encoding='utf-8').read()

# Replace handleDirectAudioSend entirely with a safe version
audio_func_old = re.compile(r"const handleDirectAudioSend = async \(blob\) => \{.*?setIsSendingChat\(false\);\s*\};", re.DOTALL)
audio_func_new = """const handleDirectAudioSend = async (blob) => {
    setIsSendingChat(true);
    try {
      const msgId = genId('msg');
      const msgTime = now();
      const tempAudioUrl = URL.createObjectURL(blob);
      
      const optimisticMsg = { id: msgId, organization_id: activeOrg?.id, from: currentUser?.id, fromName: currentUser?.full_name, text: '', time: msgTime, type: 'chat', audioUrl: tempAudioUrl, attachmentUrl: null, reactions: {} };
      if (activeChat === 'group') setGroupMessages(prev => { const exists = prev.find(m=>m.id===msgId); if(exists) return prev; return [...prev, optimisticMsg]; });
      else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); setDmThreads(prev => ({ ...prev, [key]: [...(prev[key] || []), optimisticMsg] })); }
      
      setAudioBlob(null);
      let audioUrl = null;
      
      const fileName = `${msgId}_audio.webm`;
      const { error: uploadErr } = await supabase.storage.from('chat_attachments').upload(fileName, blob);
      if (uploadErr) {
          console.error('Audio upload error:', uploadErr);
          // Insert failed message so user knows
      } else {
          audioUrl = supabase.storage.from('chat_attachments').getPublicUrl(fileName).data.publicUrl;
      }
      
      if (activeChat === 'group' && activeOrg?.id) {
          await supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: '', msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null });
      } else if (activeChat === 'dm' && activeDmUser) { 
          const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); 
          await supabase.from('dm_messages').insert({ id: msgId, thread_key: key, from_id: currentUser.id, from_name: currentUser.full_name, text: '', msg_time: msgTime, audio_url: audioUrl, attachment_url: null }); 
      }
    } catch(err) {
      console.error('Direct audio send error:', err);
    } finally {
      setIsSendingChat(false);
    }
  };"""

d = audio_func_old.sub(audio_func_new, d)

# Replace handleSendMessage entirely with a safe version
text_func_old = re.compile(r"const handleSendMessage = async \(e\) => \{.*?setIsSendingChat\(false\);\s*\};", re.DOTALL)
text_func_new = """const handleSendMessage = async (e) => {
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

    try {
      let filesToProcess = currentAttachmentFiles;
      if (filesToProcess.length > 1 && attachmentSource !== 'gallery') {
        const zip = new JSZip();
        for (let i = 0; i < filesToProcess.length; i++) {
          const f = filesToProcess[i];
          const path = f.webkitRelativePath || f.name;
          zip.file(path, f);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        const zipFile = new File([content], "Attachments.zip", { type: 'application/zip' });
        filesToProcess = [zipFile];
      }

      if (filesToProcess.length > 0) {
        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          const msgId = genId('msg');
          const msgTime = now();
          const blobUrl = URL.createObjectURL(file);
          const optimisticMsg = { id: msgId, organization_id: activeOrg?.id, from: currentUser?.id, fromName: currentUser?.full_name, text: i === 0 ? currentChatInput : '', time: msgTime, type: 'chat', attachmentUrl: blobUrl, audioUrl: null, reactions: {}, fileName: file.name, fileSize: file.size };
          
          if (activeChat === 'group') setGroupMessages(prev => [...prev, optimisticMsg]);
          else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); setDmThreads(prev => ({ ...prev, [key]: [...(prev[key] || []), optimisticMsg] })); }

          const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storageFileName = `${msgId}_${safeFileName}`;
          const { error: uploadErr } = await supabase.storage.from('chat_attachments').upload(storageFileName, file, { contentType: file.type });
          if (uploadErr) { console.error('Upload error:', uploadErr); continue; }
          const realUrl = supabase.storage.from('chat_attachments').getPublicUrl(storageFileName).data.publicUrl;

          if (activeChat === 'group') setGroupMessages(prev => prev.map(m => m.id === msgId ? { ...m, attachmentUrl: realUrl } : m));
          else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); setDmThreads(prev => ({ ...prev, [key]: (prev[key] || []).map(m => m.id === msgId ? { ...m, attachmentUrl: realUrl } : m) })); }

          const msgText = i === 0 && currentChatInput ? currentChatInput : '';
          const msgData = { id: msgId, from_id: currentUser.id, from_name: currentUser.full_name, text: msgText, msg_time: msgTime, type: 'chat', audio_url: null, attachment_url: realUrl };
          if (activeChat === 'group' && activeOrg?.id) await supabase.from('group_messages').insert({ ...msgData, organization_id: activeOrg.id });
          else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); await supabase.from('dm_messages').insert({ ...msgData, thread_key: key }); }
        }
      } else {
        const msgId = genId('msg');
        const msgTime = now();
        let audioUrl = null;
        
        const optimisticMsg = { id: msgId, organization_id: activeOrg?.id, from: currentUser?.id, fromName: currentUser?.full_name, text: currentChatInput, time: msgTime, type: 'chat', attachmentUrl: null, audioUrl: currentAudioBlob ? URL.createObjectURL(currentAudioBlob) : null, reactions: {} };
        if (activeChat === 'group') setGroupMessages(prev => [...prev, optimisticMsg]);
        else if (activeChat === 'dm' && activeDmUser) { const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); setDmThreads(prev => ({ ...prev, [key]: [...(prev[key] || []), optimisticMsg] })); }

        if (currentAudioBlob) {
          const audioFileName = `${msgId}_audio.webm`;
          const { error: audioErr } = await supabase.storage.from('chat_attachments').upload(audioFileName, currentAudioBlob);
          if (!audioErr) audioUrl = supabase.storage.from('chat_attachments').getPublicUrl(audioFileName).data.publicUrl;
        }

        if (activeChat === 'group' && activeOrg?.id) {
            await supabase.from('group_messages').insert({ id: msgId, organization_id: activeOrg.id, from_id: currentUser.id, from_name: currentUser.full_name, text: currentChatInput, msg_time: msgTime, type: 'chat', audio_url: audioUrl, attachment_url: null });
        } else if (activeChat === 'dm' && activeDmUser) { 
            const key = [currentUser?.id, activeDmUser?.id].sort().join('_'); 
            await supabase.from('dm_messages').insert({ id: msgId, thread_key: key, from_id: currentUser.id, from_name: currentUser.full_name, text: currentChatInput, msg_time: msgTime, audio_url: audioUrl, attachment_url: null }); 
        }
      }
    } catch(err) {
      console.error('Send message error:', err);
    } finally {
      setIsSendingChat(false);
    }
  };"""

d = text_func_old.sub(text_func_new, d)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Updated chat sending functions safely!")
