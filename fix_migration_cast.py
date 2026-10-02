import sys

with open('db/migrations/006_phase3b_security_approvals.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

sql = sql.replace('auth.uid()', 'auth.uid()::text')

with open('db/migrations/006_phase3b_security_approvals.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print("Fixed migration SQL with UUID to Text cast")
