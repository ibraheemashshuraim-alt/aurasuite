
import re

def fix_dashboard(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    # Change delete to update for digital_cards
    content = content.replace(
        "await supabase.from(\x27digital_cards\x27).delete().eq(\x27profile_id\x27, userId);",
        "await supabase.from(\x27digital_cards\x27).update({ is_revoked: true }).eq(\x27profile_id\x27, userId);"
    )

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)

fix_dashboard("frontend/app/login/page.js")

