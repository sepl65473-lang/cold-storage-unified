const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

const brainDir = "C:\\Users\\DELL\\.gemini\\antigravity\\brain\\f782eb05-7eb9-4911-967a-a2f752b2b5d4";
const files = fs.readdirSync(brainDir).filter(f => f.startsWith("media__") && f.endsWith(".png"));
if (files.length === 0) { console.error("No image found"); process.exit(1); }

// Sort by latest modified
files.sort((a,b) => fs.statSync(path.join(brainDir, b)).mtimeMs - fs.statSync(path.join(brainDir, a)).mtimeMs);
const target = path.join(brainDir, files[0]);

console.log("Processing", target);

Jimp.read(target).then(img => {
    // 1. Detect bounds of the non-white pixels to ensure the circle wraps the blue logo exactly.
    let minX = img.bitmap.width, maxX = 0;
    let minY = img.bitmap.height, maxY = 0;
    
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
        let r = this.bitmap.data[idx + 0];
        let g = this.bitmap.data[idx + 1];
        let b = this.bitmap.data[idx + 2];
        
        // Treat pixels darker than very-light-gray as the logo
        if (r < 240 || g < 240 || b < 240) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    });

    console.log(`Logo bounds detected: X(${minX} to ${maxX}), Y(${minY} to ${maxY})`);
    
    let w = maxX - minX;
    let h = maxY - minY;
    let maxDim = Math.max(w, h);
    
    // Add a tiny padding 
    minX = Math.max(0, minX - 2);
    minY = Math.max(0, minY - 2);
    maxDim += 4;
    
    // Crop it nicely to the bounds of the logo (make it a perfect square based on max dimension)
    let centerX = minX + w/2;
    let centerY = minY + h/2;
    
    let cropX = centerX - (maxDim / 2);
    let cropY = centerY - (maxDim / 2);
    
    // Create a new blank square image to hold the centered logo
    new Jimp(maxDim, maxDim, 0x00000000, (err, squareImg) => {
        if (err) throw err;
        
        // Crop the original image to just the logo area (w x h)
        img.crop(minX, minY, w, h);
        
        // Paste the cropped image into the center of our perfect square
        squareImg.composite(img, (maxDim - w) / 2, (maxDim - h) / 2);
        
        // Finally, cut the square into a circle mask!
        squareImg.circle();
        
        const out = path.join(brainDir, "sepl_logo_round_beautiful.png");
        squareImg.writeAsync(out).then(() => console.log("Done! Saved to:", out));
    });

}).catch(console.error);
