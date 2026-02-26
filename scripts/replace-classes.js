const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Replacements for adaptable theming
            content = content.replace(/text-white/g, 'text-foreground');
            content = content.replace(/border-white/g, 'border-foreground');
            content = content.replace(/bg-white/g, 'bg-foreground');
            content = content.replace(/text-black/g, 'text-background');
            content = content.replace(/bg-black/g, 'bg-background');
            content = content.replace(/bg-neutral-900/g, 'bg-surface');
            content = content.replace(/bg-neutral-800/g, 'bg-surface hover:bg-surface\\/80');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

// Point to the correct src directory
const srcPath = path.resolve(__dirname, '..', 'src');
processDirectory(srcPath);
console.log('Class replacement complete.');
