import re

def update_agents(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        code = f.read()

    # The block we want to replace is from `                        {/* We will leave a few animated elements on top to give it a 'live' UI feel */}`
    # to `                        {/* UI Overlay Controls (Avatars at top) */}`
    
    start_str = "{/* We will leave a few animated elements on top to give it a 'live' UI feel */}"
    end_str = "{/* UI Overlay Controls (Avatars at top) */}"
    
    replacement = """{/* CSS Animated Characters */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                            {/* Character 1 (Walks from door to desk) */}
                            <div className="absolute top-0 left-0" style={{ animation: 'walkPath1 15s linear infinite' }}>
                                <div className="relative w-5 h-8 scale-[1.5]">
                                    <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#f5d0b5] rounded-sm border border-black/20 shadow-sm"></div>
                                    <div className="absolute -top-0.5 left-0 w-5 h-2 bg-amber-800 rounded-t-sm"></div>
                                    <div className="absolute top-4 left-0.5 w-4 h-4 bg-purple-500 rounded-sm border border-black/20"></div>
                                    <div className="absolute top-8 left-1 w-1.5 h-3 bg-blue-900 rounded-sm origin-top animate-[legSwing_0.5s_infinite_linear]"></div>
                                    <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-blue-900 rounded-sm origin-top animate-[legSwing_0.5s_infinite_linear] [animation-delay:0.25s]"></div>
                                    <div className="absolute top-10 -left-1 w-7 h-1.5 bg-black/40 rounded-full blur-[1px]"></div>
                                </div>
                            </div>
                            
                            {/* Character 2 (Walks around) */}
                            <div className="absolute top-0 left-0" style={{ animation: 'walkPath2 20s linear infinite', animationDelay: '2s' }}>
                                <div className="relative w-5 h-8 scale-[1.5]">
                                    <div className="absolute top-0 left-0.5 w-4 h-4 bg-[#f5d0b5] rounded-sm border border-black/20 shadow-sm"></div>
                                    <div className="absolute -top-0.5 left-0 w-5 h-2 bg-slate-800 rounded-t-sm"></div>
                                    <div className="absolute top-4 left-0.5 w-4 h-4 bg-cyan-500 rounded-sm border border-black/20"></div>
                                    <div className="absolute top-8 left-1 w-1.5 h-3 bg-slate-900 rounded-sm origin-top animate-[legSwing_0.6s_infinite_linear]"></div>
                                    <div className="absolute top-8 left-2.5 w-1.5 h-3 bg-slate-900 rounded-sm origin-top animate-[legSwing_0.6s_infinite_linear] [animation-delay:0.3s]"></div>
                                    <div className="absolute top-10 -left-1 w-7 h-1.5 bg-black/40 rounded-full blur-[1px]"></div>
                                    
                                    <div className="absolute -top-10 -left-10 bg-white text-black text-[7px] px-2 py-1 rounded shadow-lg whitespace-nowrap font-bold border border-gray-200">
                                        Heading to the meeting!
                                        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-white rotate-45 border-r border-b border-gray-200"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        """
    
    if start_str in code and end_str in code:
        start_idx = code.find(start_str)
        end_idx = code.find(end_str)
        
        code = code[:start_idx] + replacement + code[end_idx:]
        
        with open(filepath, 'w', encoding='utf8') as f:
            f.write(code)
        print(f"Updated {filepath}")
    else:
        print(f"Strings not found in {filepath}")

update_agents('frontend/app/dashboard/page.js')
update_agents('frontend/app/login/page.js')
