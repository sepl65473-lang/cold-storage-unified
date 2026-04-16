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
    
    // First, let's find the true bounds of the non-white pixels
    let minX = img.bitmap.width, maxX = 0;
    let minY = img.bitmap.height, maxY = 0;
    
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
        let r = this.bitmap.data[idx + 0];
        let g = this.bitmap.data[idx + 1];
        let b = this.bitmap.data[idx + 2];
        if (r < 240 || g < 240 || b < 240) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    });
    
    let w = maxX - minX;
    let h = maxY - minY;
    
    // Crop exactly to the bounds of the logo to remove asymmetrical white borders
    img.crop(minX, minY, w, h);
    
    // Now just apply circle!
    img.circle();
    
    const out = path.join(brainDir, "sepl_logo_round_final.png");
    img.writeAsync(out).then(() => console.log("Done:", out));

}).catch(console.error);
