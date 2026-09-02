import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

visibility_fix = """
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          setCurrentMinute(new Date().getMinutes());
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);
"""

d = d.replace("return () => clearInterval(int);\n    }, []);", "return () => clearInterval(int);\n    }, []);\n" + visibility_fix)

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
print("Added visibilitychange fix")
