import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    # 1. Extract and remove all client tabs
    tabs_to_extract = ['project_preview', 'deliverables', 'client_invoices', 'client_mgmt']
    extracted_blocks = {}

    for tab in tabs_to_extract:
        # We need to find `{activeTab === 'tab' && (` and its matching closing `)}`
        pattern = r"\{\s*activeTab === '" + tab + r"'\s*&&\s*\("
        match = re.search(pattern, code)
        if not match:
            continue
        
        start_idx = match.start()
        # Find matching closing bracket for the `(` after `&&`
        # Wait, the `{` opens the expression, and `}` closes it.
        # `{activeTab === 'tab' && ( ... )}`
        
        open_braces = 0
        end_idx = -1
        for i in range(start_idx, len(code)):
            if code[i] == '{':
                open_braces += 1
            elif code[i] == '}':
                open_braces -= 1
                if open_braces == 0:
                    end_idx = i + 1
                    break
        
        if end_idx != -1:
            extracted_blocks[tab] = code[start_idx:end_idx]
            # Replace with spaces to keep index, we will clean it up later.
            # Actually better to just replace the chunk with empty string, but we need to do it carefully.
            # We will do it in reverse order of index to avoid shifting.

    # Remove the extracted blocks
    for tab in tabs_to_extract:
        if tab in extracted_blocks:
            code = code.replace(extracted_blocks[tab], "")

    # 2. Find the end of `settings` tab.
    # It starts with `{activeTab === 'settings' && (`
    settings_pattern = r"\{\s*activeTab === 'settings'\s*&&\s*\("
    settings_match = re.search(settings_pattern, code)
    if not settings_match:
        print(f"[{filepath}] Could not find settings tab")
        return
        
    start_idx = settings_match.start()
    open_braces = 0
    end_idx = -1
    for i in range(start_idx, len(code)):
        if code[i] == '{':
            open_braces += 1
        elif code[i] == '}':
            open_braces -= 1
            if open_braces == 0:
                end_idx = i + 1
                break

    if end_idx == -1:
        print(f"[{filepath}] Could not find end of settings tab")
        return

    # 3. Insert the extracted blocks right after the settings tab (inside the scroll container)
    blocks_to_insert = "\n\n          " + "\n\n          ".join(extracted_blocks.values()) + "\n"
    
    code = code[:end_idx] + blocks_to_insert + code[end_idx:]

    with open(filepath, 'w', encoding='utf8') as f:
        f.write(code)

    print(f"[{filepath}] Fixed layout!")

fix_file('frontend/app/dashboard/page.js')
fix_file('frontend/app/login/page.js')
