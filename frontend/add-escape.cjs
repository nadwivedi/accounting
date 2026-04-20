const fs = require('fs');
const path = require('path');

const baseDirs = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'components')
];

const processFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let cnt = fs.readFileSync(filePath, 'utf8');
  if (cnt.includes("if (key === 'escape') {") || cnt.includes('if (key === "escape") {') || !cnt.includes('const handleKeyDown = (event)')) {
    return;
  }
  
  if (!cnt.includes('useNavigate') && cnt.includes('react-router-dom')) {
    cnt = cnt.replace(/import\s+{([^}]+)}\s+from\s+['"]react-router-dom['"];/, (m, p1) => {
      if (!p1.includes('useNavigate')) {
        return `import { ${p1}, useNavigate } from 'react-router-dom';`;
      }
      return m;
    });
  } else if (!cnt.includes('useNavigate') && !cnt.includes('react-router-dom')) {
    cnt = cnt.replace(/(import .*? from 'react';\n)/, `$1import { useNavigate } from 'react-router-dom';\n`);
  }
  
  const compMatch = cnt.match(/export default function (\w+)\([^)]*\) {/);
  if (compMatch && !cnt.includes('const navigate = useNavigate();') && cnt.includes('useNavigate')) {
    cnt = cnt.replace(/(export default function \w+\([^)]*\) {\n)/, `$1  const navigate = useNavigate();\n`);
  }
  
  const escapeBlock = `      if (key === 'escape') {
        const popup = document.querySelector('.fixed.inset-0.z-50');
        if (popup) return; // let popup handle it
        event.preventDefault();
        
        if (typeof showForm !== 'undefined' && showForm) {
          handleCloseForm();
        } else if (typeof modalOnly !== 'undefined' && modalOnly && typeof onModalFinish === 'function') {
          onModalFinish();
        } else if (typeof navigate !== 'undefined') {
          navigate('/');
        } else {
          window.location.href = '/';
        }
        return;
      }\n\n`;
      
   cnt = cnt.replace(/(const key = event\.key\?\.toLowerCase\(\);\n)/, `$1${escapeBlock}`);
   
   fs.writeFileSync(filePath, cnt);
   console.log('Updated: ' + filePath);
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.jsx')) processFile(full);
  }
};

baseDirs.forEach(walk);
