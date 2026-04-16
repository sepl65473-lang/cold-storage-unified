import glob
import os
from PIL import Image, ImageDraw
import numpy as np

# Find the most recently uploaded image in the brain directory
search_path = r"C:\Users\DELL\.gemini\antigravity\brain\f782eb05-7eb9-4911-967a-a2f752b2b5d4\media__*.png"
files = glob.glob(search_path)
files.sort(key=os.path.getmtime, reverse=True)

if not files:
    print("No image found.")
    exit()

img_path = files[0]
print(f"Processing image: {img_path}")

img = Image.open(img_path).convert("RGBA")
img_array = np.array(img)

# Find the bounding box of the non-white pixels (the blue circle)
# A pixel is "non-white" if it's significantly darker than 255
# Red channel < 240 or Green < 240 or Blue < 240
non_white_pixels = np.where((img_array[:,:,0] < 240) | (img_array[:,:,1] < 240) | (img_array[:,:,2] < 240))

if len(non_white_pixels[0]) == 0:
    print("Image is entirely white?")
    exit()

min_y = np.min(non_white_pixels[0])
max_y = np.max(non_white_pixels[0])
min_x = np.min(non_white_pixels[1])
max_x = np.max(non_white_pixels[1])

print(f"Bounding box: x({min_x}, {max_x}), y({min_y}, {max_y})")

# Calculate the center and radius of the circle
center_x = (min_x + max_x) // 2
center_y = (min_y + max_y) // 2
radius = max((max_x - min_x) // 2, (max_y - min_y) // 2)

# Create a circular mask
mask = Image.new('L', img.size, 0)
draw = ImageDraw.Draw(mask)
draw.ellipse((center_x - radius, center_y - radius, center_x + radius, center_y + radius), fill=255)

# Apply the mask
result = Image.new('RGBA', img.size, (0, 0, 0, 0))
result.paste(img, (0, 0), mask=mask)

# Crop the result to the bounding box of the circle to remove excess transparent space
result = result.crop((center_x - radius, center_y - radius, center_x + radius, center_y + radius))

output_path = r"C:\Users\DELL\.gemini\antigravity\brain\f782eb05-7eb9-4911-967a-a2f752b2b5d4\sepl_logo_round_artifact.png"
result.save(output_path)
print(f"Saved circular logo to {output_path}")
