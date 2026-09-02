import re

def main():
    with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # Find the org status update and add error logging/alerting
    code = code.replace(
        "await supabase.from('organizations').update({ status: newStatus }).eq('id', org.id);",
        "const { error: updErr } = await supabase.from('organizations').update({ status: newStatus }).eq('id', org.id);\n            if (updErr) { alert('DB Update Failed: ' + updErr.message); throw updErr; }"
    )
    
    # Do the same for handleToggleOrgLock
    code = code.replace(
        "await supabase.from('organizations').update({ working_hours: newHours }).eq('id', org.id);",
        "const { error: lockErr } = await supabase.from('organizations').update({ working_hours: newHours }).eq('id', org.id);\n            if (lockErr) { alert('DB Update Failed: ' + lockErr.message); throw lockErr; }"
    )

    with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    main()
