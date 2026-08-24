import re

d = open('frontend/app/dashboard/page.js', 'r', encoding='utf-8').read()

tick_code = """
  useEffect(() => {
    const int = setInterval(() => setTimeTick(t => t + 1), 30000);
    return () => clearInterval(int);
  }, []);
"""

if "setTimeTick(t => t + 1)" not in d:
    d = re.sub(r"(\s*// .*Render .*\n)", "\n" + tick_code.replace('\\', '\\\\') + r"\1", d)
    with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(d)
    print("Injected tick successfully")
else:
    print("Already injected")
