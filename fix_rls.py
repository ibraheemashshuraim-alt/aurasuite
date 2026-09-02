import re

def main():
    with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # Create anonSupabase at the top
    anon_client = """
import { createClient } from '@supabase/supabase-js';
const anonSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});
"""
    if "anonSupabase" not in code:
        code = code.replace("import { supabase } from '../../lib/supabase';", "import { supabase } from '../../lib/supabase';\n" + anon_client)

    # Fix handleChangeOrgStatus
    old_status_update = "const { error: updErr } = await supabase.from('organizations').update({ status: newStatus }).eq('id', org.id);"
    new_status_update = """
            const { data: updData, error: updErr } = await anonSupabase.from('organizations').update({ status: newStatus }).eq('id', org.id).select();
            if (updErr || !updData || updData.length === 0) { alert('DB Update Failed (RLS Policy). Contact Support to fix permissions.'); return; }
"""
    code = code.replace(old_status_update, new_status_update.strip())

    # Fix the duplicate throw
    code = code.replace("if (updErr) { alert('DB Update Failed: ' + updErr.message); throw updErr; }", "")

    # Fix handleToggleOrgLock
    old_lock_update = "const { error: lockErr } = await supabase.from('organizations').update({ working_hours: newHours }).eq('id', org.id);"
    new_lock_update = """
            const { data: lockData, error: lockErr } = await anonSupabase.from('organizations').update({ working_hours: newHours }).eq('id', org.id).select();
            if (lockErr || !lockData || lockData.length === 0) { alert('DB Lock Update Failed (RLS Policy). Contact Support to fix permissions.'); return; }
"""
    code = code.replace(old_lock_update, new_lock_update.strip())

    # Fix the duplicate throw
    code = code.replace("if (lockErr) { alert('DB Update Failed: ' + lockErr.message); throw lockErr; }", "")
    
    # Also fix delete org just in case
    old_del = "await supabase.from('organizations').delete().eq('id', org.id);"
    new_del = "await anonSupabase.from('organizations').delete().eq('id', org.id);"
    code = code.replace(old_del, new_del)

    with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    main()
