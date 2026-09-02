const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const anonSupabase = createClient(url, key, { auth: { persistSession: false } });

async function del() {
    const orgId = 'org-1787068311529-7199';
    console.log('Fetching profiles...');
    const { data: orgProfiles, error: fetchErr } = await anonSupabase.from('profiles').select('id').eq('organization_id', orgId);
    if (fetchErr) return console.log('fetchErr', fetchErr);
    
    if (orgProfiles) {
        for (const p of orgProfiles) {
            console.log('Deleting data for profile', p.id);
            await anonSupabase.from('digital_cards').delete().eq('profile_id', p.id);
            await anonSupabase.from('presence').delete().eq('user_id', p.id);
            await anonSupabase.from('tasks').delete().eq('assigned_to', p.id);
            await anonSupabase.from('group_messages').delete().eq('from_id', p.id);
            await anonSupabase.from('dm_messages').delete().eq('from_id', p.id);
            const { error: profDelErr } = await anonSupabase.from('profiles').delete().eq('id', p.id);
            if (profDelErr) return console.log('profDelErr', profDelErr);
        }
    }
    
    console.log('Deleting meetings...');
    const { error: mErr } = await anonSupabase.from('meetings').delete().eq('organization_id', orgId);
    if (mErr) return console.log('mErr', mErr);
    
    console.log('Deleting tasks...');
    const { error: tErr } = await anonSupabase.from('tasks').delete().eq('organization_id', orgId);
    if (tErr) return console.log('tErr', tErr);
    
    console.log('Deleting org presence...');
    const { error: pErr } = await anonSupabase.from('presence').delete().eq('organization_id', orgId);
    if (pErr) return console.log('pErr', pErr);

    console.log('Deleting org...');
    const { error: oErr } = await anonSupabase.from('organizations').delete().eq('id', orgId);
    if (oErr) return console.log('oErr', oErr);

    console.log('DONE!');
}

del();
