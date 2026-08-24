with open('clean_quiz.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace specific known multiline strings
content = content.replace("? 'اے آئی اسکلز \nاسسمنٹ'", "? 'اے آئی اسکلز اسسمنٹ'")
content = content.replace("? 'AuraSuite AI کو آپ کا پروفائل \nتیار کرنے دیں۔'", "? 'AuraSuite AI کو آپ کا پروفائل تیار کرنے دیں۔'")
content = content.replace("? 'AuraSuite میں خوش آمدید! \nہمارے AI کو آپ کی مہارتوں کا اندازہ لگانا ہے تاکہ آپ کو درست ٹاسکس \nدیے جا سکیں۔'", "? 'AuraSuite میں خوش آمدید! ہمارے AI کو آپ کی مہارتوں کا اندازہ لگانا ہے تاکہ آپ کو درست ٹاسکس دیے جا سکیں۔'")
content = content.replace("? 'یہ آپ کی مہارت \nکا اصل ٹیسٹ ہے۔ اسے پاس کرنے کے لیے کم از کم 3 درست جوابات درکار \nہیں۔'", "? 'یہ آپ کی مہارت کا اصل ٹیسٹ ہے۔ اسے پاس کرنے کے لیے کم از کم 3 درست جوابات درکار ہیں۔'")
content = content.replace("? 'اسسمنٹ فیل \nہو گیا'", "? 'اسسمنٹ فیل ہو گیا'")
content = content.replace("? 'اسسمنٹ مکمل \nہو گیا'", "? 'اسسمنٹ مکمل ہو گیا'")
content = content.replace("? آپ نے \n میں سے  کا صحیح جواب دیا۔ پاس ہونے کے لیے کم از کم 3\nدرست جوابات درکار ہیں۔", "? آپ نے  میں سے  کا صحیح جواب دیا۔ پاس ہونے کے لیے کم از کم 3 درست جوابات درکار ہیں۔")
content = content.replace("? اسکور: /5۔ آپ کو \nٹائر", "? اسکور: /5۔ آپ کو ٹائر")
content = content.replace("? 'ری ڈائریکٹ \nکیا جا رہا ہے...'", "? 'ری ڈائریکٹ کیا جا رہا ہے...'")
content = content.replace("? 'دوبارہ کوشش \nکریں'", "? 'دوبارہ کوشش کریں'")
content = content.replace("? 'تیار \nہو رہا ہے...'", "? 'تیار ہو رہا ہے...'")

with open('clean_quiz.txt', 'w', encoding='utf-8') as f:
    f.write(content)
