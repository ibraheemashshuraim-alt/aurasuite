import re

def fix_dashboard():
    with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
        c = f.read()

    # 1. Add DM Poller to the Chat Poller effect
    chat_poller_regex = re.compile(
        r"(const chatInterval = setInterval\(async \(\) => \{\s*"
        r"const \{ data \} = await supabase\.from\('group_messages'\)\.select\('\*'\)\.eq\('organization_id', activeOrg\.id\)\.order\('id', \{ ascending: true \}\);\s*"
        r"if \(data\) \{\s*"
        r"setGroupMessages\(data\.map\(m => \(\{ id: m\.id, organization_id: m\.organization_id, from: m\.from_id, fromName: m\.from_name, text: m\.text, time: m\.msg_time, type: m\.type, meetingId: m\.meeting_id, deletedFor: m\.deleted_for \|\| \[\], attachmentUrl: m\.attachment_url, audioUrl: m\.audio_url, reactions: m\.reactions \|\| \{\} \}\)\)\);\s*"
        r"\}\s*"
        r"\}, 3000\);)", re.MULTILINE
    )

    new_poller = """const chatInterval = setInterval(async () => {
      // Group Messages
      const { data } = await supabase.from('group_messages').select('*').eq('organization_id', activeOrg.id).order('id', { ascending: true });
      if (data) {
        setGroupMessages(data.map(m => ({ id: m.id, organization_id: m.organization_id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, type: m.type, meetingId: m.meeting_id, deletedFor: m.deleted_for || [], attachmentUrl: m.attachment_url, audioUrl: m.audio_url, reactions: m.reactions || {} })));
      }
      
      // DM Messages
      const { data: dmData } = await supabase.from('dm_messages').select('*').or(`thread_key.ilike.%${currentUserRef.current?.id}%`).order('id', { ascending: true });
      if (dmData) {
         const newThreads = {};
         dmData.forEach(m => {
            if (!newThreads[m.thread_key]) newThreads[m.thread_key] = [];
            newThreads[m.thread_key].push({ id: m.id, from: m.from_id, fromName: m.from_name, text: m.text, time: m.msg_time, audioUrl: m.audio_url, attachmentUrl: m.attachment_url, deletedFor: m.deleted_for || [], reactions: m.reactions || {} });
         });
         setDmThreads(newThreads);
      }
    }, 3000);"""
    
    if "const { data: dmData }" not in c:
        c = chat_poller_regex.sub(new_poller.replace('\\', '\\\\'), c)

    # 2. Fix Invite Generation so it RESETS skills and category
    invite_profile_regex = re.compile(
        r"category: isUpdate \? existingProfile\.category : \(genInviteCategory \|\| null\),\s*"
        r"domain: isUpdate \? existingProfile\.domain : \(genInviteDomain \|\| ''\),\s*"
        r"skills: isUpdate \? \(existingProfile\.skills \|\| \[\]\) : \[\],"
    )

    new_invite_profile = """category: genInviteCategory || null,
                      domain: genInviteDomain || '',
                      skills: [],"""
                      
    c = invite_profile_regex.sub(new_invite_profile, c)

    with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Dashboard fixed")

def fix_login():
    with open('frontend/app/login/page.js', 'r', encoding='utf-8') as f:
        c = f.read()

    # Add immediate check for is_revoked inside loginTokenParam
    token_logic = """if (decoded.orgName) setAuthOrgName(decoded.orgName);
            }
          } catch(e) { /* ignore invalid token */ }
        }"""
        
    new_token_logic = """if (decoded.orgName) setAuthOrgName(decoded.orgName);
              
              // IMMEDIATELY CHECK IF SUSPENDED/REVOKED
              supabase.from('digital_cards').select('is_revoked').eq('card_number', decoded.card).eq('username', decoded.username).maybeSingle().then(({data}) => { 
                if (data?.is_revoked) setKickoutModal(true); 
              });
            }
          } catch(e) { /* ignore invalid token */ }
        }"""

    if "IMMEDIATELY CHECK IF SUSPENDED" not in c:
        c = c.replace(token_logic, new_token_logic)

    with open('frontend/app/login/page.js', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Login fixed")

fix_dashboard()
fix_login()
