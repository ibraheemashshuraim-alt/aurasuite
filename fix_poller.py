import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

bad_poller = """    // Robust Worker State Poller (Guarantees live lock/unlock and org hours sync)
    useEffect(() => {
      if (currentUserRef.current?.role !== 'worker') return;
      const int = setInterval(async () => {
        if (currentUserRef.current?.id) {"""

good_poller = """    // Robust Worker State Poller (Guarantees live lock/unlock and org hours sync)
    useEffect(() => {
      const int = setInterval(async () => {
        if (currentUserRef.current?.role !== 'worker') return;
        if (currentUserRef.current?.id) {"""

d = d.replace(bad_poller, good_poller)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Fixed worker poller")
