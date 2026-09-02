import re

def update_agent_town(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    # We want to replace the inside of the Map Area
    # from `{/* Floor Grid */}` down to `{/* UI Overlay Controls (Avatars at top) */}`
    
    start_str = "{/* Floor Grid */}"
    end_str = "{/* UI Overlay Controls (Avatars at top) */}"
    
    if start_str in code and end_str in code:
        start_idx = code.find(start_str)
        end_idx = code.find(end_str)
        
        replacement = """{/* Actual Pixel Art Map Background */}
                        <div className="absolute inset-0 bg-[#1a1b26]">
                            <img src="/agent-town-map.png" alt="Agent Town Map" className="w-full h-full object-cover opacity-90 mix-blend-lighten" />
                        </div>
                        
                        {/* Scanning / Radar Effect Overlay to make it feel alive */}
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px)]" style={{ backgroundSize: '100% 4px', animation: 'scanline 8s linear infinite' }}></div>
                        
                        {/* We will leave a few animated elements on top to give it a 'live' UI feel */}
                        <div className="absolute bottom-28 left-40 animate-bounce" style={{ animationDelay: '0.5s' }}>
                            <div className="bg-white text-black text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap font-bold relative">
                                Staying hydrated!
                                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-white rotate-45"></div>
                            </div>
                        </div>

                        """
        
        code = code[:start_idx] + replacement + code[end_idx:]
        
        with open(filepath, 'w', encoding='utf8') as f:
            f.write(code)
        print(f"Updated {filepath}")
    else:
        print(f"Strings not found in {filepath}")

update_agent_town('frontend/app/dashboard/page.js')
update_agent_town('frontend/app/login/page.js')
