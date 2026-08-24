import sys
import subprocess

def restore_quiz(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    result = subprocess.run(['git', 'show', 'c1d46dd:frontend/app/login/page.js'], capture_output=True)
    old_content = result.stdout.decode('utf-8', errors='ignore')

    start_idx = old_content.find("if (showQuiz) {")
    end_idx = old_content.find("MAIN APP", start_idx)
    # Roll back to the line start
    end_idx = old_content.rfind("\n", start_idx, end_idx)
    
    quiz_code = old_content[start_idx:end_idx] + "\n\n  "

    curr_start = content.find("if (showQuiz) {")
    curr_end = content.find("KICKOUT MODAL OVERLAY", curr_start)
    curr_end = content.rfind("\n", curr_start, curr_end)
    # Roll back to the comment start
    curr_end = content.rfind("  //", curr_start, curr_end)

    new_content = content[:curr_start] + quiz_code + content[curr_end:]
    
    if "getRandomQuestions" not in new_content:
        new_content = new_content.replace("import { supabase } from '../../lib/supabase';", "import { supabase } from '../../lib/supabase';\nimport { getRandomQuestions } from '../../lib/questionBank';")

    states = "    const [quizLang, setQuizLang] = useState('en');\n    const [actualQuizQuestions, setActualQuizQuestions] = useState([]);\n    const [actualQuizAnswers, setActualQuizAnswers] = useState({});\n    const [quizScore, setQuizScore] = useState(0);\n    const [quizFailed, setQuizFailed] = useState(false);\n    const [isEnteringDashboard, setIsEnteringDashboard] = useState(false);\n"
    
    if "const [quizLang" not in new_content:
        new_content = new_content.replace("const [quizLoading, setQuizLoading] = useState(false);", "const [quizLoading, setQuizLoading] = useState(false);\n" + states)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully restored quiz in", path)

restore_quiz('frontend/app/login/page.js')
restore_quiz('frontend/app/dashboard/page.js')
