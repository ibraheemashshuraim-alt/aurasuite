import sys

with open('frontend/app/api/engine/action-plan/approve/route.js', 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace("supabase.from('users')", "supabase.from('profiles')")

with open('frontend/app/api/engine/action-plan/approve/route.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Fixed route.js")
