from PIL import Image

img = Image.open('C:/Users/abdullah/.gemini/antigravity/brain/73a9e030-a86b-43a4-937b-ae8584e32def/empty_office_map_1788373272365.jpg')
width, height = img.size

# The bottom half seems to be the clean map
# It starts around y=500
crop = img.crop((10, 495, 980, 960))
crop.save('frontend/public/agent-town-map-clean.png')
print("Saved clean map")
