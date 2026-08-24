import re

def robust_replace(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Read the extracted quiz
    with open('clean_quiz.txt', 'r', encoding='utf-8') as f:
        quiz_code = f.read()

    start_idx = content.find("if (showQuiz) {")
    if start_idx == -1:
        print("Not found in", path)
        return

    # Find the end of the block
    brace_count = 0
    started = False
    end_idx = -1
    
    # We parse char by char to find the matching brace of the if (showQuiz) {
    for i in range(start_idx, len(content)):
        if content[i] == '{':
            if not started:
                started = True
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if started and brace_count == 0:
                end_idx = i + 1
                break
                
    if end_idx == -1:
        print("Could not find end of quiz in", path)
        return

    # Now replace it!
    new_content = content[:start_idx] + quiz_code + content[end_idx:]

    if "getRandomQuestions" not in new_content:
        new_content = new_content.replace("import { supabase } from '../../lib/supabase';", "import { supabase } from '../../lib/supabase';\nimport { getRandomQuestions } from '../../lib/questionBank';")

    states = "  const [quizLang, setQuizLang] = useState('en');\n  const [actualQuizQuestions, setActualQuizQuestions] = useState([]);\n  const [actualQuizAnswers, setActualQuizAnswers] = useState({});\n  const [quizScore, setQuizScore] = useState(0);\n  const [quizFailed, setQuizFailed] = useState(false);\n  const [isEnteringDashboard, setIsEnteringDashboard] = useState(false);\n"
    
    if "const [quizLang" not in new_content:
        new_content = new_content.replace("const [quizLoading, setQuizLoading] = useState(false);", "const [quizLoading, setQuizLoading] = useState(false);\n" + states)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fixed", path)

robust_replace('frontend/app/login/page.js')
robust_replace('frontend/app/dashboard/page.js')
