
import re

def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the bad kickout modal which starts around:
    # if (kickoutModal || currentUser?.role === \x27suspended\x27 || currentUser?.status === \x27suspended\x27 || currentUser?.role === \x27banned\x27) {
    # and ends with return ( ... ); }
    
    # We can use regex to remove it
    pattern = re.compile(r"if \(kickoutModal \|\| currentUser\?\.role === \x27suspended\x27 \|\| currentUser\?\.status === \x27suspended\x27 \|\| currentUser\?\.role === \x27banned\x27\) \{[\s\S]*?Return to Login\s*</button>\s*</div>\s*</div>\s*\);\s*}", re.MULTILINE)
    
    if pattern.search(content):
        content = pattern.sub("", content)
        print(f"Removed bad kickout from {filename}")
    else:
        print(f"Bad kickout not found in {filename}")
        
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)

fix_file("frontend/app/dashboard/page.js")
fix_file("frontend/app/login/page.js")

