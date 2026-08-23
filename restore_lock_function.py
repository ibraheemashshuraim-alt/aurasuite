
import re

func_str = """
export function checkIsEffectivelyLocked(user, org) {
  if (!user || user.role !== "worker") return false;
  
  if (user.is_locked) return true;
  if (user.force_unlocked) return false;

  if (org) {
    if (org.working_hours?.is_24_7) return false;

    const currentDay = new Date().getDay();
    const workingDays = org.working_days || [1,2,3,4,5];
    if (!workingDays.includes(currentDay)) return true;

    if (org.working_hours) {
      const { start, end } = org.working_hours;
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      
      const [sh, sm] = (start || "00:00").split(":").map(Number);
      const startMin = sh * 60 + sm;
      
      const [eh, em] = (end || "23:59").split(":").map(Number);
      const endMin = eh * 60 + em;

      if (startMin <= endMin) {
        if (currentMin < startMin || currentMin > endMin) return true;
      } else {
        if (currentMin < startMin && currentMin > endMin) return true;
      }
    }
  }
  return false;
}
"""

def add_func(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "function checkIsEffectivelyLocked" in content:
        print(f"Already in {filename}")
        return
        
    pattern = re.compile(r"const today = \(\) => new Date\(\)\.toISOString\(\)\.split\(\x27T\x27\)\[0\];")
    match = pattern.search(content)
    if not match:
        print(f"Could not find insert point in {filename}")
        return
        
    new_content = content[:match.end()] + "\n" + func_str + content[match.end():]
    with open(filename, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Added function to {filename}")

add_func("frontend/app/dashboard/page.js")
add_func("frontend/app/login/page.js")

