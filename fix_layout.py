import sys

def fix_layout(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    # Find the end of settings tab
    settings_marker = "Update Password\n                      </button>\n                    </div>\n                  </div>\n                </div>\n              </div>\n            )}"
    
    settings_idx = code.find(settings_marker)
    if settings_idx == -1:
        print(f"[{filepath}] Could not find settings_marker")
        return
        
    start_of_div = settings_idx + len(settings_marker)
    
    # We expect something like "\n  \n          </div>\n" right after.
    div_marker = "</div>"
    div_idx = code.find(div_marker, start_of_div)
    
    if div_idx == -1:
        print(f"[{filepath}] Could not find </div> after settings")
        return
        
    # The client tabs start right after this div.
    # Where do they end?
    # In dashboard: "        {viewOrgDetails && (" or "{/* Org View Details Popup */}"
    # In login: "{/*  ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? SIDEBAR"
    
    end_marker1 = "{/* Org View Details Popup */}"
    end_marker2 = "{/* "
    
    end_idx = code.find(end_marker1, div_idx + len(div_marker))
    if end_idx == -1:
        end_idx = code.find("{/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 SIDEBAR", div_idx)
        if end_idx == -1:
             end_idx = code.find("        <aside className=\"w-64 glass-panel", div_idx)

    if end_idx == -1:
        print(f"[{filepath}] Could not find end of client tabs")
        return
        
    # The div we want to move is between `start_of_div` and the end of `div_idx + len(div_marker)`.
    # Let's just find the exact text of the </div>.
    
    # Actually, it's easier to just find the `</div>` that closes the container and remove it, 
    # and re-add it right before `end_idx`.
    
    div_content = code[start_of_div:div_idx + len(div_marker)]
    
    # Remove the div_content
    code_without_div = code[:start_of_div] + code[div_idx + len(div_marker):end_idx] + div_content + code[end_idx:]
    
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(code_without_div)
    print(f"[{filepath}] Fixed layout successfully!")

fix_layout('frontend/app/dashboard/page.js')
fix_layout('frontend/app/login/page.js')
