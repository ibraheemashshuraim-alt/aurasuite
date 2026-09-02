import re

def fix_agents(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    # We will replace the static classes with cool animations.
    code = code.replace(
        '<div className="absolute top-14 left-8 animate-bounce">',
        '<div className="absolute top-14 left-8" style={{animation: "walkAround 12s infinite linear"}}>'
    )
    
    code = code.replace(
        '<div className="absolute top-16 left-44 animate-bounce"',
        '<div className="absolute top-16 left-44"'
    )
    
    code = code.replace(
        '<div className="absolute bottom-12 right-14 animate-bounce"',
        '<div className="absolute bottom-12 right-14" style={{animation: "walkToDoor 15s infinite linear"}}'
    )
    
    with open(filepath, 'w', encoding='utf8') as f:
        f.write(code)

fix_agents('frontend/app/dashboard/page.js')
fix_agents('frontend/app/login/page.js')
