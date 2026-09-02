import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

update_working_hours_old = "addNotification('Working hours updated.', 'success');"
update_working_hours_new = """addNotification('Working hours updated.', 'success');
        if (kickoutChannelRef.current) {
            kickoutChannelRef.current.send({ type: 'broadcast', event: 'org-working-hours', payload: { orgId: activeOrg.id, working_hours: newHours } });
        }"""
d = d.replace(update_working_hours_old, update_working_hours_new)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Applied org broadcast")
