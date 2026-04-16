const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

const brainDir = "C:\\Users\\DELL\\.gemini\\antigravity\\brain\\f782eb05-7eb9-4911-967a-a2f752b2b5d4";
const files = fs.readdirSync(brainDir).filter(f => f.startsWith("media__") && f.endsWith(".png"));
if (files.length === 0) { console.error("No image found"); process.exit(1); }

files.sort((a,b) => fs.statSync(path.join(brainDir, b)).mtimeMs - fs.statSync(path.join(brainDir, a)).mtimeMs);
const target = path.join(brainDir, files[0]);

console.log("Processing", target);

Jimp.read(target).then(img => {
    // Replace the white background with transparency
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
        var red = this.bitmap.data[idx + 0];
        var green = this.bitmap.data[idx + 1];
        var blue = this.bitmap.data[idx + 2];
        var alpha = this.bitmap.data[idx + 3];

        // If the pixel is very white, make it transparent
        if (red > 245 && green > 245 && blue > 245) {
            // BUT wait, we don't want to make the middle white transparent!
            // Instead, let's just use .circle() to mask it.
        }
    });

    // Jimp's circle() creates a circular mask at the center.
    // If we want it perfectly tight, we first autocrop the white
    // But white autocrop is tricky. Let's just apply the circle mask!
    
    // Instead of raw circle, we find the first non-white pixel to find bounds
    let minX = img.bitmap.width, maxX = 0;
    let minY = img.bitmap.height, maxY = 0;
    let hasNonWhite = false;

    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
        let r = this.bitmap.data[idx + 0];
        let g = this.bitmap.data[idx + 1];
        let b = this.bitmap.data[idx + 2];
        if (r < 240 || g < 240 || b < 240) {
            hasNonWhite = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    });

    if (hasNonWhite) {
        let w = maxX - minX;
        let h = maxY - minY;
        let centerX = minX + w/2;
        let centerY = minY + h/2;
        let radius = Math.max(w/2, h/2);
        
        console.log(`Bounds: X(${minX}-${maxX}), Y(${minY}-${maxY})`);
        
        // We crop to a tight square around the logo
        img.crop(centerX - radius, centerY - radius, radius*2, radius*2);
        // Then we mask it into a circle
        img.circle();
    } else {
        img.circle();
    }
    
    const out = path.join(brainDir, "sepl_logo_round_final.png");
    img.writeAsync(out).then(() => console.log("Done:", out));
}).catch(console.error);
