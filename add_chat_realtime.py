
def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    target = ".on(\x27postgres_changes\x27, { event: \x27*\x27, schema: \x27public\x27, table: \x27tasks\x27 }, () => {\n        supabase.from(\x27tasks\x27).select(\x27*\x27).then(({ data }) => { if (data) setTasks(data); });\n      })"
    
    replacement = target + "\n      .on(\x27postgres_changes\x27, { event: \x27*\x27, schema: \x27public\x27, table: \x27group_messages\x27 }, () => {\n        supabase.from(\x27group_messages\x27).select(\x27*\x27).order(\x27created_at\x27, { ascending: true }).then(({ data }) => {\n          if (data) setGroupMessages(data.map(m => ({ id: m.id, organization_id: m.organization_id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {}, fileName: m.file_name, fileSize: m.file_size })));\n        });\n      })"
    
    content = content.replace(target, replacement)
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {filename}")

fix_file("frontend/app/dashboard/page.js")
fix_file("frontend/app/login/page.js")

