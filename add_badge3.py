import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

badge = """
      <main className="relative min-h-screen">
        <div className="fixed bottom-4 right-4 z-[9999999999] bg-green-500 text-white font-bold px-4 py-2 rounded-full shadow-lg">
          Deployed: Aug 25 19:55
        </div>
"""

d = d.replace('      <main className="relative min-h-screen">', badge)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Added green deployed badge")
