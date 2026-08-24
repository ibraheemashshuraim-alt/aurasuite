const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Remove all Kickout and Lock Modals
    const kickoutRegex = /  \/\/ 🚨🚨 KICKOUT MODAL OVERLAY \(HIGHEST PRIORITY\) 🚨🚨\r?\n  if \(kickoutModal \|\| currentUser\?\.role === "suspended" \|\| currentUser\?\.status === "suspended"\) \{[\s\S]*?    \};\r?\n  \}\r?\n/g;
    const lockRegex = /  \/\/ 🚨🚨 LOCK MODAL OVERLAY 🚨🚨\r?\n  const isEffectivelyLocked = lockModal \|\| checkIsEffectivelyLocked\(currentUser, activeOrg\);\r?\n  if \(isEffectivelyLocked && currentUser\?\.role === "worker"\) \{[\s\S]*?    \};\r?\n  \}\r?\n/g;

    content = content.replace(kickoutRegex, '');
    content = content.replace(lockRegex, '');
    content = content.replace(/  \/\/ 🚨🚨 KICKOUT MODAL OVERLAY \(HIGHEST PRIORITY\) 🚨🚨\n  if \(kickoutModal \|\| currentUser\?\.role === "suspended" \|\| currentUser\?\.status === "suspended"\) \{\n    return \([\s\S]*?    \);\n  \}\n/g, '');
    content = content.replace(/  \/\/ 🚨🚨 LOCK MODAL OVERLAY 🚨🚨\n  const isEffectivelyLocked = lockModal \|\| checkIsEffectivelyLocked\(currentUser, activeOrg\);\n  if \(isEffectivelyLocked && currentUser\?\.role === "worker"\) \{\n    return \([\s\S]*?    \);\n  \}\n/g, '');

    // 2. Insert both above isCheckingSession
    const modals = 
  // 🚨🚨 KICKOUT MODAL OVERLAY (HIGHEST PRIORITY) 🚨🚨
  if (kickoutModal || currentUser?.role === "suspended" || currentUser?.status === "suspended") {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Access Revoked</h2>
          <p className="text-red-400 text-sm mb-6">Your access card has been suspended by the Admin.</p>
          <button
            onClick={() => {
              try { window.close(); } catch (e) {}
              localStorage.removeItem("aura_session");
              sessionStorage.removeItem("aura_session");
              window.location.href = "/";
            }}
            className="px-8 py-3 bg-red-950/60 hover:bg-red-900/80 text-white font-semibold rounded-xl border border-red-500/30 transition-all"
          >
            Close Portal
          </button>
        </div>
      </div>
    );
  }

  // 🚨🚨 LOCK MODAL OVERLAY 🚨🚨
  const isEffectivelyLocked = lockModal || checkIsEffectivelyLocked(currentUser, activeOrg);
  if (isEffectivelyLocked && currentUser?.role === "worker") {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-yellow-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="flex justify-center mb-4">
             <Lock size={48} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Off-Day / Access Locked</h2>
          <p className="text-yellow-400 text-sm mb-6">Your portal access is currently locked for an off-day or by an admin. Enjoy your break!</p>
          <button
            onClick={() => {
              try { window.close(); } catch (e) {}
              localStorage.removeItem("aura_session");
              sessionStorage.removeItem("aura_session");
              window.location.href = "/";
            }}
            className="px-8 py-3 bg-yellow-950/60 hover:bg-yellow-900/80 text-white font-semibold rounded-xl border border-yellow-500/30 transition-all"
          >
            Close Portal
          </button>
        </div>
      </div>
    );
  }
;
    content = content.replace('  // Show loading until: (1) component mounted AND (2) session check done', modals + '\n  // Show loading until: (1) component mounted AND (2) session check done');

    // 3. Fix fetchInitialData
    content = content.replace("supabase.from('group_messages').select('*').order('created_at', { ascending: true })", "supabase.from('group_messages').select('*').order('id', { ascending: true })");

    // 4. Remove bad listener EXACT MATCH
    const badListener = "        .on('postgres_changes', { event: '*', schema: 'public', table: 'group_messages' }, () => {\n          supabase.from('group_messages').select('*').order('created_at', { ascending: true }).then(({ data }) => {\n            if (data) setGroupMessages(data.map(m => ({ id: m.id, organization_id: m.organization_id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {}, fileName: m.file_name, fileSize: m.file_size })));\n          });\n        })";
    content = content.replace(badListener, "");
    const badListener2 = "        .on('postgres_changes', { event: '*', schema: 'public', table: 'group_messages' }, () => {\r\n          supabase.from('group_messages').select('*').order('created_at', { ascending: true }).then(({ data }) => {\r\n            if (data) setGroupMessages(data.map(m => ({ id: m.id, organization_id: m.organization_id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {}, fileName: m.file_name, fileSize: m.file_size })));\r\n          });\r\n        })";
    content = content.replace(badListener2, "");

    // 5. Update Poller select to include lock status
    content = content.replace(".select('role')", ".select('role, is_locked, force_unlocked')");

    // 6. Update Poller to apply lock status
    const oldPollerCheck =           if (data && ['suspended', 'banned', 'deleted'].includes(data.role)) {\r\n            setKickoutModal(true);\r\n          };
    const newPollerCheck =           if (data && ['suspended', 'banned', 'deleted'].includes(data.role)) {\n            setKickoutModal(true);\n          } else if (data) {\n            setCurrentUser(prev => {\n              if (!prev) return prev;\n              if (prev.is_locked !== data.is_locked || prev.force_unlocked !== data.force_unlocked) {\n                return { ...prev, is_locked: data.is_locked, force_unlocked: data.force_unlocked };\n              }\n              return prev;\n            });\n          };
    content = content.replace(oldPollerCheck, newPollerCheck);
    
    // same for non-windows
    const oldPollerCheck2 =           if (data && ['suspended', 'banned', 'deleted'].includes(data.role)) {\n            setKickoutModal(true);\n          };
    content = content.replace(oldPollerCheck2, newPollerCheck);

    // 7. Inject broadcast into handleSendMessage
    const sendChatReplace =       setIsSendingChat(true);;
    const broadcastCode =       setIsSendingChat(true);\n      if (activeChat === 'group' && kickoutChannelRef.current) {\n        kickoutChannelRef.current.send({\n          type: 'broadcast',\n          event: 'new-group-message',\n          payload: {\n            id: msgId, organization_id: activeOrg?.id, from: currentUser?.id, fromName: currentUser?.full_name, text: currentChatInput || (currentAttachmentFiles?.length > 0 ? "Attachment" : ""), time: msgTime, type: 'chat', attachmentUrl: null, audioUrl: null, reactions: {}\n          }\n        });\n      };
    // only replace the first occurrence in handleSendMessage? I'll replace all to be safe.
    content = content.replace(new RegExp(sendChatReplace, 'g'), broadcastCode);

    // 8. Fix the showQuiz check
    content = content.replace("setShowQuiz(!user.skills);", "setShowQuiz(!(user.skills || []).includes('assessment_completed'));");

    fs.writeFileSync(file, content, 'utf8');
}

fixFile('frontend/app/login/page.js');
fixFile('frontend/app/dashboard/page.js');
