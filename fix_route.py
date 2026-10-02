import sys

with open('frontend/app/api/engine/action-plan/approve/route.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;",
    "const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key_for_build';"
)
content = content.replace(
    "const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;",
    "const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy_url_for_build.supabase.co';"
)

with open('frontend/app/api/engine/action-plan/approve/route.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed route.js for build!")
