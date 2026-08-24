import re

d = open('frontend/app/dashboard/page.js', 'r', encoding='utf-8').read()

# Remove the injected pollers
poller_regex = re.compile(
    r"\s*// -{52}\s*// INJECTED POLLERS\s*// -{52}\s*useEffect\(\(\) => \{.*?// -{52}",
    re.DOTALL
)

d = poller_regex.sub("", d)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)

print("Removed destructive chat poller successfully!")
