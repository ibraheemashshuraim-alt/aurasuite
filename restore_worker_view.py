import re

with open('extracted_worker_view_clean.txt', 'r', encoding='utf8') as f:
    worker_views = f.read()

# Add a newline at the start just in case
worker_views = "\n" + worker_views + "\n"

for filepath in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    # The marker is exactly `              </div>)} {/* ═══════ SCHEDULES TAB ═══════ */}`
    # Or just `{/* ═══════ SCHEDULES TAB ═══════ */}`
    
    target_str = "              </div>)} {/* ═══════ SCHEDULES TAB ═══════ */}"
    
    if target_str in code:
        code = code.replace(target_str, worker_views + target_str)
        with open(filepath, 'w', encoding='utf8') as f:
            f.write(code)
        print(f"Injected into {filepath}")
    else:
        print(f"Target string not found in {filepath}!")
