import re

def fix_login(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to change:
    # if (hasInviteToken || hasOldInvite || hasCard) {
    #   setIsCheckingSession(false);
    #   return;
    # }
    
    # To:
    # if (hasInviteToken || hasOldInvite || hasCard) {
    #   // Don't set isCheckingSession false immediately, let the URL params effect do it
    #   return;
    # }
    
    content = content.replace(
        "if (hasInviteToken || hasOldInvite || hasCard) {\n        setIsCheckingSession(false);\n        return;\n      }",
        "if (hasInviteToken || hasOldInvite || hasCard) {\n        // Handled by second effect\n        return;\n      }"
    )
    
    # And in the second useEffect:
    # if (cardParam && userParam) { ... supabase.from ... .then(...) }
    
    # We should ensure setIsCheckingSession(false) is called inside the .then()!
    # And also for the other branches!
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_login('frontend/app/login/page.js')
