import re

def refactor_agent_town(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    start_str = "{/* AGENT TOWN & VOICE ASSISTANT */}"
    end_str = "{/* CLIENT VIEW IN DASHBOARD */}"
    
    if start_str in code and end_str in code:
        start_idx = code.find(start_str)
        # Find the div closing right before end_str
        end_idx = code.find(end_str)
        
        replacement = """{/* AGENT TOWN & VOICE ASSISTANT */}
                <AgentTown currentUser={currentUser} />
                
                """
        
        # Add import at the top
        if "import AgentTown" not in code:
            code = code.replace("import { supabase } from '../../lib/supabase';", "import { supabase } from '../../lib/supabase';\nimport AgentTown from '../../components/AgentTown';")
        
        code = code[:start_idx] + replacement + code[end_idx:]
        
        with open(filepath, 'w', encoding='utf8') as f:
            f.write(code)
        print(f"Refactored {filepath}")
    else:
        print(f"Strings not found in {filepath}")

refactor_agent_town('frontend/app/dashboard/page.js')
refactor_agent_town('frontend/app/login/page.js')
