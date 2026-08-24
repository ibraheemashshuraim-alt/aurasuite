import sys

def restore_quiz(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Get the original quiz block from the old commit
    import subprocess
    result = subprocess.run(['git', 'show', 'c1d46dd:frontend/app/login/page.js'], capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print("Error getting git show")
        return
        
    old_content = result.stdout
    
    # Extract the block
    start_str = "    // ══════════════════ AI QUIZ (ONBOARDING) ══════════════════\n    if (showQuiz) {"
    if start_str not in old_content:
        # try another encoding or different string
        start_str = "if (showQuiz) {"

    # It's better to just extract it with regex or index
    start_idx = old_content.find("if (showQuiz) {")
    end_idx = old_content.find("    // ══════════════════ MAIN APP ══════════════════", start_idx)
    
    if start_idx == -1 or end_idx == -1:
        print("Could not find start/end bounds in old_content")
        return
        
    quiz_code = old_content[start_idx:end_idx]

    # Find where to replace in the current file
    curr_start = content.find("if (showQuiz) {")
    curr_end = content.find("    // ══════════════════ MAIN APP ══════════════════", curr_start)
    if curr_end == -1:
         # maybe it's KICKOUT MODAL OVERLAY
         curr_end = content.find("  // 🚨🚨 KICKOUT MODAL OVERLAY", curr_start)
         
    if curr_start == -1 or curr_end == -1:
        print("Could not find start/end bounds in current file")
        return

    new_content = content[:curr_start] + quiz_code + content[curr_end:]
    
    # Add imports
    if "getRandomQuestions" not in new_content:
        new_content = new_content.replace("import { supabase } from '../../lib/supabase';", "import { supabase } from '../../lib/supabase';\nimport { getRandomQuestions } from '../../lib/questionBank';")

    # Add states
    states = "    const [quizLang, setQuizLang] = useState('en');\n    const [actualQuizQuestions, setActualQuizQuestions] = useState([]);\n    const [actualQuizAnswers, setActualQuizAnswers] = useState({});\n    const [quizScore, setQuizScore] = useState(0);\n    const [quizFailed, setQuizFailed] = useState(false);\n    const [isEnteringDashboard, setIsEnteringDashboard] = useState(false);\n"
    
    if "const [quizLang" not in new_content:
        new_content = new_content.replace("const [quizLoading, setQuizLoading] = useState(false);", "const [quizLoading, setQuizLoading] = useState(false);\n" + states)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)

restore_quiz('frontend/app/login/page.js')
restore_quiz('frontend/app/dashboard/page.js')
