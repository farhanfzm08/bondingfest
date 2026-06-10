// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('components')];
let totalReplaced = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // We want to find patterns where an element has a dark bg, and its child or itself has text-black.
  // Actually, let's just replace 'text-black' with 'text-white' when the same line or nearby line has dark bg classes.
  
  // Replace text-black with text-white in elements that contain these classes:
  const darkClasses = [
    'bg-[#0891B2]', 'bg-[#1C1917]', 'bg-indigo-', 'bg-black', 'bg-violet-', 'btn-neon', 'neu-btn-primary', 'neu-btn-coral', 'neu-btn-dark'
  ];

  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('text-black')) {
      // Check if this line or previous 2 lines contain a dark class
      let hasDarkClass = false;
      for (let j = Math.max(0, i - 2); j <= i; j++) {
        if (darkClasses.some(c => lines[j].includes(c))) {
          hasDarkClass = true;
          break;
        }
      }
      
      // Also, if it's the "btn-neon" it has white text by default in CSS, but if someone added text-black, remove it
      if (hasDarkClass) {
        lines[i] = lines[i].replace(/text-black/g, 'text-white');
      }
    }
  }

  content = lines.join('\n');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced++;
  }
});

console.log(`Fixed text colors in ${totalReplaced} files.`);
