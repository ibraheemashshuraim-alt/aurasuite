import re

files = ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # Add debounce state to playSoundEffect
    pattern = r"const playSoundEffect = \(type\) => \{"
    replacement = """let lastSoundTime = 0;
  let lastSoundType = '';
  const playSoundEffect = (type) => {
    if (Date.now() - lastSoundTime < 200 && lastSoundType === type) return;
    lastSoundTime = Date.now();
    lastSoundType = type;"""
    
    code = re.sub(pattern, replacement, code)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

print("Added debounce to sounds")
