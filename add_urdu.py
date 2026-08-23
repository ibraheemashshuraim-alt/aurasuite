
import re

def fix_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    target = """<p className="text-xs font-bold text-purple-200">{idx + 1}. {q.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map(opt => (
                        <button key={opt} onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className={`p-2 rounded-lg text-[10px] font-bold border transition-all ${quizAnswers[q.id] 
=== opt ? \x27bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]\x27 : \x27bg-[#11081c] 
border-purple-500/20 text-purple-300 hover:border-purple-500/50\x27}`}>
                          {opt}
                        </button>
                      ))}
                    </div>"""
                    
    replacement = """<p className="text-xs font-bold text-purple-200">{idx + 1}. {q.question}</p>
                    {q.question_ur && <p className="text-xs font-bold text-purple-300 mb-2" dir="rtl" style={{fontFamily: \x27Jameel Noori Nastaleeq, Noto Nastaliq Urdu, sans-serif\x27}}>{q.question_ur}</p>}
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <button key={opt} onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className={`p-2 rounded-lg text-[10px] font-bold border transition-all ${quizAnswers[q.id] === opt ? \x27bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]\x27 : \x27bg-[#11081c] border-purple-500/20 text-purple-300 hover:border-purple-500/50\x27}`}>
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span>{opt}</span>
                            {q.options_ur && q.options_ur[optIdx] && <span dir="rtl" className="text-[9px] opacity-80" style={{fontFamily: \x27Jameel Noori Nastaleeq, Noto Nastaliq Urdu, sans-serif\x27}}>{q.options_ur[optIdx]}</span>}
                          </div>
                        </button>
                      ))}
                    </div>"""
                    
    # Note: formatting might be slightly off due to terminal wrapping, I will use regex
    pattern = re.compile(r"<p className=\"text-xs font-bold text-purple-200\">\{idx \+ 1\}\. \{q\.question\}</p>\s*<div className=\"grid grid-cols-2 gap-2\">\s*\{q\.options\.map\(opt => \(\s*<button key=\{opt\}.*?\{opt\}\s*</button>\s*\)\)\}\s*</div>", re.DOTALL)
    
    if pattern.search(content):
        content = pattern.sub(replacement, content)
        print(f"Added Urdu quiz to {filename}")
    else:
        print(f"Pattern not found in {filename}")

    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)

fix_file("frontend/app/dashboard/page.js")
fix_file("frontend/app/login/page.js")

