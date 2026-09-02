from PIL import Image

# Open the image
img = Image.open('C:/Users/abdullah/.gemini/antigravity/brain/73a9e030-a86b-43a4-937b-ae8584e32def/.user_uploaded/media_1788362383740.png')

# The image size is 1024x544.
# The Agent Town panel starts roughly at x=180, y=170 and ends at x=780, y=490.
# Let's crop it and save it.
# We will do a few test crops to see which one is best.
crop1 = img.crop((190, 180, 785, 485))
crop1.save('frontend/public/agent-town-map.png')
print("Saved agent-town-map.png")
