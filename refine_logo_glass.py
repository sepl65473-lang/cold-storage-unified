import os
from PIL import Image, ImageDraw, ImageFilter, ImageChops

def create_glassy_logo(input_path, output_path, size=512):
    # 1. Load the original image and convert to RGBA
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return
    
    img = Image.open(input_path).convert("RGBA")
    
    # 2. Create high-resolution working canvas (4x larger for antialiasing)
    work_size = size * 2
    canvas = Image.new("RGBA", (work_size, work_size), (0, 0, 0, 0))
    
    # Resize original to fit
    logo = img.resize((work_size, work_size), Image.Resampling.LANCZOS)
    
    # 3. Create a perfect high-res mask for the circle
    mask = Image.new("L", (work_size, work_size), 0)
    draw = ImageDraw.Draw(mask)
    padding = 4
    draw.ellipse((padding, padding, work_size-padding, work_size-padding), fill=255)
    
    # 4. Apply the mask to the logo
    glassy_logo = Image.new("RGBA", (work_size, work_size), (0, 0, 0, 0))
    glassy_logo.paste(logo, (0, 0), mask=mask)
    
    # 5. Add "Glaze/Sheen" Effect (Glass reflection)
    # This is a semi-transparent white oval at the top
    sheen_mask = Image.new("L", (work_size, work_size), 0)
    sheen_draw = ImageDraw.Draw(sheen_mask)
    # Draw an oval for the reflection
    sheen_draw.ellipse((work_size*0.1, -work_size*0.1, work_size*0.9, work_size*0.5), fill=120) # 120 is the reflection opacity (0-255)
    
    # Blur the sheen for a softer look
    sheen_mask = sheen_mask.filter(ImageFilter.GaussianBlur(15))
    
    # Create the white sheen layer
    sheen_layer = Image.new("RGBA", (work_size, work_size), (255, 255, 255, 0))
    # Fill the sheen layer with white where the mask is
    sheen = Image.new("RGBA", (work_size, work_size), (255, 255, 255, 100)) # subtle white
    sheen_layer.paste(sheen, (0, 0), mask=sheen_mask)
    
    # Composite the sheen onto the logo
    final_logo = Image.alpha_composite(glassy_logo, sheen_layer)
    
    # 6. Add "Border Shine" (a thin bright edge at the top)
    border_mask = Image.new("L", (work_size, work_size), 0)
    border_draw = ImageDraw.Draw(border_mask)
    border_draw.ellipse((padding, padding, work_size-padding, work_size-padding), outline=180, width=5)
    # Blend it
    border_mask = border_mask.filter(ImageFilter.GaussianBlur(2))
    border_layer = Image.new("RGBA", (work_size, work_size), (255, 255, 255, 0))
    border_white = Image.new("RGBA", (work_size, work_size), (255, 255, 255, 80))
    border_layer.paste(border_white, (0, 0), mask=border_mask)
    
    final_logo = Image.alpha_composite(final_logo, border_layer)
    
    # 7. Final Resize (Antialiasing)
    final_logo = final_logo.resize((size, size), Image.Resampling.LANCZOS)
    
    # 8. Save
    final_logo.save(output_path, "PNG")
    print(f"Glassy logo saved to: {output_path}")

# Source path from the user's brain directory
# We will use the 'sepl_round_logo.png' already found there.
source = r"C:\Users\DELL\.gemini\antigravity\brain\f782eb05-7eb9-4911-967a-a2f752b2b5d4\sepl_round_logo.png"
# Save it in the project root first for preview
output = "sepl_logo_glassy_preview.png"

create_glassy_logo(source, output)

# Also save to project assets directly
assets_path_1 = r"d:\project\Cold storage web and app\smaatechengineering-website\frontend\src\assets\sepl-logo.png"
assets_path_2 = r"d:\project\Cold storage web and app\marketing-site\public\sepl_round_logo.png"

create_glassy_logo(source, assets_path_1)
create_glassy_logo(source, assets_path_2)
