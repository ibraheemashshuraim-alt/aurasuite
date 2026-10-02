from PIL import Image

# Original screenshot with characters
img = Image.open('C:/Users/abdullah/.gemini/antigravity/brain/73a9e030-a86b-43a4-937b-ae8584e32def/.user_uploaded/media_1788362383740.png').convert("RGBA")

# We need to guess the bounding boxes of some characters.
# Looking at the full image 1024x544:
# Character 1 (sitting bottom left): x=290, y=410
# Character 2 (standing right): x=580, y=210
# Let's crop a small 30x40 box around these and we can adjust.

char1 = img.crop((280, 390, 310, 430))
char1.save('frontend/public/sprite1.png')

char2 = img.crop((570, 200, 600, 240))
char2.save('frontend/public/sprite2.png')

char3 = img.crop((390, 320, 420, 360))
char3.save('frontend/public/sprite3.png')

print("Saved sprites")
