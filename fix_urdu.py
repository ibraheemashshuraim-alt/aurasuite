import re

for filepath in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # The corrupted text might be slightly different depending on read/write, let's use a regex on the English part
    pattern = r"<p className=\"text-yellow-400 text-sm mb-6 leading-relaxed\">.*?<br/><br/>\(Some issue has occurred, work is in progress\. The account will be reactivated as soon as the work is complete\.\)</p>"
    replacement = """<p className="text-yellow-400 text-sm mb-6 leading-relaxed">کچھ مسئلہ پیش آ گیا ہے، کام جاری ہے۔ اکاؤنٹ جلد ہی بحال کر دیا جائے گا۔<br/><br/>(Some issue has occurred, work is in progress. The account will be reactivated as soon as the work is complete.)</p>"""
    
    # We must use DOTALL since there might be newlines
    new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_code)

print("Fixed Urdu text in both files")
