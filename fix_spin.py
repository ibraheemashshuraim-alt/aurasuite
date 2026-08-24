import re

d = open('frontend/app/dashboard/page.js', 'r', encoding='utf-8').read()

# Remove the broken manual broadcast outside the try-catch in handleSendMessage
broken_broadcast_regex = re.compile(
    r"\s*if \(activeChat === 'group' && kickoutChannelRef\.current\) \{\s*kickoutChannelRef\.current\.send\(\{\s*type: 'broadcast',\s*event: 'new-group-message',\s*payload: \{\s*id: msgId.*?\s*\}\s*\}\);\s*\}"
)

# Replace with nothing (the DB realtime + poller will handle the sync)
d = broken_broadcast_regex.sub("", d)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Removed broken manual broadcast")
