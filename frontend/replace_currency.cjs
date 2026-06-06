const fs = require('fs');
const path = require('path');

function processFile(p) {
  let txt = fs.readFileSync(p, 'utf8');
  let original = txt;
  
  // 1. Replace $${...} with ₹${...}
  txt = txt.replace(/\$\$\{/g, '₹${');
  
  // 2. Replace ($) with (₹)
  txt = txt.replace(/\(\$\)/g, '(₹)');
  
  // 3. Replace $ followed by digit with ₹
  txt = txt.replace(/\$(?=\d)/g, '₹');
  
  // 4. Replace DollarSign icon with IndianRupee
  txt = txt.replace(/DollarSign/g, 'IndianRupee');
  
  if (original !== txt) {
    fs.writeFileSync(p, txt);
    console.log('Updated', p);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.jsx') || p.endsWith('.tsx') || p.endsWith('.js')) {
      processFile(p);
    }
  });
}

walk('src');
console.log('Done');
