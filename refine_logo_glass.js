const { Jimp, rgbaToInt } = require("jimp");
const path = require("path");
const fs = require("fs");

// Input: The logo I made in the previous session
const inputPath = path.join("C:", "Users", "DELL", ".gemini", "antigravity", "brain", "f782eb05-7eb9-4911-967a-a2f752b2b5d4", "sepl_round_logo.png");
const previewPath = "sepl_logo_glassy_preview.png";

// Project assets to update
const targets = [
    // Logos
    path.join("smaatechengineering-website", "frontend", "src", "assets", "sepl-logo.png"),
    path.join("marketing-site", "public", "sepl_round_logo.png"),
    path.join("marketing-site", "src", "assets", "sepl-logo.png"),
    
    // Favicons (PNG and SVG wrapping PNG)
    path.join("marketing-site", "public", "favicon.png"),
    path.join("marketing-site", "public", "favicon.svg"),
    path.join("smaatechengineering-website", "frontend", "public", "favicon.svg"),
    path.join("it-freelancer-template", "frontend", "public", "favicon.svg"),
    path.join("Cold storage admin panle", "public", "favicon.svg")
];

async function refineLogo() {
    try {
        console.log("Loading original logo from:", inputPath);
        
        // Ensure folders exist for all targets
        targets.forEach(p => {
            const dir = path.dirname(p);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        const image = await Jimp.read(inputPath);
        const size = image.bitmap.width; 
        
        // 1. Create a "Glass Sheen" (Glaze)
        const sheen = new Jimp({ width: size, height: size, color: 0x00000000 });
        
        for (let y = 0; y < size / 2; y++) {
            for (let x = 0; x < size; x++) {
                const dx = (x - size / 2) / (size / 2);
                const dy = (y - size / 4) / (size / 4);
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 1.0) {
                    const alpha = Math.floor(100 * (1 - dist)); 
                    // Use the utility function directly
                    const color = rgbaToInt(255, 255, 255, alpha);
                    sheen.setPixelColor(color, x, y);
                }
            }
        }
        
        sheen.blur(10);
        
        // 2. Add "Edge Cleanliness" (Top-left highlight)
        const highlight = new Jimp({ width: size, height: size, color: 0x00000000 });
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = (x - size / 2);
                const dy = (y - size / 2);
                const r = Math.sqrt(dx * dx + dy * dy);
                const edgeDist = Math.abs(r - (size / 2 - 3));
                
                const angle = Math.atan2(dy, dx); 
                const intensity = Math.max(0, Math.cos(angle + Math.PI/4)); 
                
                if (edgeDist < 2) {
                    const alpha = Math.floor(220 * (1 - edgeDist / 2) * intensity);
                    const color = rgbaToInt(255, 255, 255, alpha);
                    highlight.setPixelColor(color, x, y);
                }
            }
        }
        highlight.blur(2);

        // 3. Composite everything
        image
            .composite(sheen, 0, 0)
            .composite(highlight, 0, 0);
        
        // 4. Save results
        console.log("Saving glassy logos and favicons...");
        await image.write(previewPath);
        
        // Export to all targets
        for (const target of targets) {
            if (target.endsWith(".svg")) {
                // If it's an SVG request, we wrap the base64 PNG for maximum compatibility with current UI
                const base64 = await image.getBase64("image/png");
                const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><image href="${base64}" width="${size}" height="${size}" /></svg>`;
                fs.writeFileSync(target, svgContent);
                console.log("- Saved SVG:", target);
            } else {
                await image.write(target);
                console.log("- Saved PNG:", target);
            }
        }
        
        console.log("Refinement and Deployment Complete!");

    } catch (err) {
        console.error("Error refining logo:", err);
    }
}

refineLogo();
