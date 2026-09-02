import re

def main():
    with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # Change the Status badge for locked to red
    code = code.replace(
        "bg-yellow-900/30 text-yellow-400 border border-yellow-500/20 flex items-center gap-1\"><Lock size={10}/> Locked</span>",
        "bg-red-900/30 text-red-400 border border-red-500/20 flex items-center gap-1\"><Lock size={10}/> Locked</span>"
    )

    with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    main()
