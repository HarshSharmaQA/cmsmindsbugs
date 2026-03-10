from PIL import Image, ImageDraw

def create_icon(size, filename):
    img = Image.new('RGBA', (size, size), color=(0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a rounded rectangle with brand color (blue variant from CSS)
    # brand-500 is roughly #3b82f6 -> (59, 130, 246)
    draw.rounded_rectangle([0, 0, size-1, size-1], radius=size//4, fill=(59, 130, 246, 255))
    
    # Draw a simple "B" for BugScribe
    # In a real scenario we'd use a font, but let's just draw some lines/shapes
    margin = size // 4
    draw.rectangle([margin, margin, margin + (size//10), size-margin], fill=(255, 255, 255, 255))
    draw.rectangle([margin, margin, size-margin, margin + (size//10)], fill=(255, 255, 255, 255))
    draw.rectangle([margin, size//2, size-margin, size//2 + (size//10)], fill=(255, 255, 255, 255))
    draw.rectangle([margin, size-margin-(size//10), size-margin, size-margin], fill=(255, 255, 255, 255))
    draw.rectangle([size-margin-(size//10), margin, size-margin, size-margin], fill=(255, 255, 255, 255))

    img.save(filename)

create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')
