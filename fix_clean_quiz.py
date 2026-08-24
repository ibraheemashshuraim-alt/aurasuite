with open('clean_quiz.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# The issue is there are literal \n inside string literals. 
# In JS, '...' cannot span multiple lines unless escaped or using template literals ....
# We will just use regex to replace \n inside the specific setQuizQuestions block.
start_idx = content.find('setQuizQuestions([')
end_idx = content.find(']);', start_idx)

if start_idx != -1 and end_idx != -1:
    block = content[start_idx:end_idx]
    # To be safe, just remove all newlines in the block, then re-add them after each },
    block = block.replace('\n', ' ')
    block = block.replace('},', '},\n')
    content = content[:start_idx] + block + content[end_idx:]

with open('clean_quiz.txt', 'w', encoding='utf-8') as f:
    f.write(content)
