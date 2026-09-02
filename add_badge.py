import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# Add a version badge to the dashboard sidebar or bottom right
badge = """
        {/* VERSION BADGE FOR DEBUGGING */}
        <div className="fixed bottom-2 right-2 text-[10px] text-gray-500 font-mono z-[9999999]">
          Build: Aug25-v1.0.5
        </div>
"""

d = d.replace("export default function AppContainer() {", "export default function AppContainer() {\n")
d = d.replace("{/* Modals & Overlays */}", badge + "\n        {/* Modals & Overlays */}")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Added version badge")
