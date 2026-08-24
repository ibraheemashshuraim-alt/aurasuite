with open('clean_quiz.txt', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("Welcome to AuraSuite! As part of our onboarding, our AI needs to assess your skill level to\nproperly tag your profile and assign you to relevant tasks.", "Welcome to AuraSuite! As part of our onboarding, our AI needs to assess your skill level to properly tag your profile and assign you to relevant tasks.")

with open('clean_quiz.txt', 'w', encoding='utf-8') as f:
    f.write(content)
