// replace_kizuna_node.js
// Recursively replace all case‑insensitive occurrences of "kizuna" with "Uyirinai"
// in files under apps/mobile with extensions .tsx, .ts, .js, .json

const fs = require('fs');
const path = require('path');

const root = path.resolve('apps/mobile');
const exts = new Set(['.tsx', '.ts', '.js', '.json']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile()) {
      if (exts.has(path.extname(entry.name))) {
        let content = fs.readFileSync(full, 'utf8');
        const newContent = content.replace(/kizuna/gi, 'Uyirinai');
        if (newContent !== content) {
          fs.writeFileSync(full, newContent, 'utf8');
          console.log(`Updated ${full}`);
        }
      }
    }
  }
}

walk(root);
