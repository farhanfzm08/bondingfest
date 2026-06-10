const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
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
  
  // Replace various gray/white text colors with black
  content = content.replace(/text-\[#78716C\]/g, 'text-black');
  content = content.replace(/text-\[#A8A29E\]/g, 'text-black');
  content = content.replace(/text-white\/[0-9]+/g, 'text-black');
  content = content.replace(/text-white/g, 'text-black');
  content = content.replace(/text-gray-[3456]00/g, 'text-black');
  content = content.replace(/text-slate-[3456]00/g, 'text-black');
  
  // If the file is competition-detail-client.tsx, it has a dark bg. The user wants black text. Let's make sure the background is light so black text is visible!
  content = content.replace(/from-indigo-900\/50 via-violet-900\/30/g, 'from-blue-100 via-indigo-50');
  content = content.replace(/from-indigo-600\/20 to-violet-800\/20/g, 'from-blue-50 to-indigo-50');
  // the 'glass' class has white text in detail. Let's make it light
  // Wait, 'glass' class is defined in globals.css with white background: .glass { background: #FFFFFF; ... }
  // So black text on glass is perfectly readable!
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced++;
  }
});

console.log(`Replaced text colors in ${totalReplaced} files.`);
