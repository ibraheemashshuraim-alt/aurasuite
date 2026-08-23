
import re

def fix_login(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    # Add DB check in cardParam and userParam
    # Find:
    # setAuthUsername(userParam);
    # setLoginMode(\x27worker\x27);
    # }
    
    content = content.replace(
        "setAuthUsername(userParam);\n        setLoginMode(\x27worker\x27);\n      }",
        "setAuthUsername(userParam);\n        setLoginMode(\x27worker\x27);\n        supabase.from(\x27digital_cards\x27).select(\x27is_revoked\x27).eq(\x27card_number\x27, cardParam).eq(\x27username\x27, userParam).maybeSingle().then(({data}) => { if (data?.is_revoked) setKickoutModal(true); });\n      }"
    )

    # Add DB check in loginTokenParam
    # Find:
    # setAuthUsername(payload.username);
    # setLoginMode(\x27worker\x27);
    # }
    
    content = content.replace(
        "setAuthUsername(payload.username);\n            setLoginMode(\x27worker\x27);\n          }",
        "setAuthUsername(payload.username);\n            setLoginMode(\x27worker\x27);\n            supabase.from(\x27digital_cards\x27).select(\x27is_revoked\x27).eq(\x27card_number\x27, payload.card).eq(\x27username\x27, payload.username).maybeSingle().then(({data}) => { if (data?.is_revoked) setKickoutModal(true); });\n          }"
    )

    content = content.replace(
        "const card = cards[0];",
        "const card = cards[0];\n      if (card.is_revoked) {\n        setKickoutModal(true);\n        return;\n      }"
    )

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Fixed {filename}")

fix_login("frontend/app/login/page.js")
fix_login("frontend/app/dashboard/page.js")

