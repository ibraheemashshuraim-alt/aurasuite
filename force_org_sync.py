import re

d = open('frontend/app/dashboard/page.js', 'r', encoding='utf-8').read()

# Make the time tick interval also fetch the latest organization data
tick_old = re.compile(r"const tick = setInterval\(\(\) => \{\s*// Force re-render basically\s*setCurrentUser\(prev => \(\{ \.\.\.prev \}\)\);\s*\}, 30000\);", re.DOTALL)
tick_new = """const tick = setInterval(() => {
        if (activeOrgRef.current?.id) {
          supabase.from('organizations').select('*').eq('id', activeOrgRef.current.id).single().then(({data}) => {
            if (data) setActiveOrg(data);
          });
        }
        setCurrentUser(prev => ({ ...prev }));
      }, 15000);"""

d = tick_old.sub(tick_new, d)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Updated time tick to fetch org data")
