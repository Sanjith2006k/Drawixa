const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Pattern: `${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api...`
  // We want to replace it with: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api...`
  // And fix the closing quote. The current string might be:
  // `${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login'
  
  // First fix the double import.meta.env.VITE_API_URL
  const badVar = /\$\{import\.meta\.env\.VITE_API_URL \|\| import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\}/g;
  if (content.match(badVar)) {
    content = content.replace(badVar, "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}");
    changed = true;
  }

  // Next, fix the closing single quote to a backtick.
  // We look for: `/api/something',` and replace with `/api/something`, `
  const badQuote = /(\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\}[^']+)'/g;
  if (content.match(badQuote)) {
    content = content.replace(badQuote, "$1`");
    changed = true;
  }

  // Also fix Canvas.jsx socket connection
  // io(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'}');
  const badSocket = /io\(`\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\}`'\)/g;
  if (content.match(badSocket)) {
    content = content.replace(badSocket, "io(import.meta.env.VITE_API_URL || 'http://localhost:5000')");
    changed = true;
  }
  
  // Check for exact io line in Canvas.jsx if the above regex didn't catch it
  const badSocket2 = /io\(`\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\}'\)/g;
  if (content.match(badSocket2)) {
    content = content.replace(badSocket2, "io(import.meta.env.VITE_API_URL || 'http://localhost:5000')");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      fixFile(fullPath);
    }
  }
}

walk(srcDir);
