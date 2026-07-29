import fs from 'fs';
import path from 'path';

function findInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f.startsWith('.') && f !== '.env' && f !== '.env.local') continue;
    if (f === 'node_modules' || f === 'dist') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      findInDir(full);
    } else if (f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.ts') || f.endsWith('.json') || f.endsWith('.env') || f.endsWith('.env.local')) {
      try {
        const text = fs.readFileSync(full, 'utf8');
        if (text.includes('service_role') && text.includes('zqoxqkyfzaywsgngiydx')) {
          console.log('FOUND MATCH IN:', full);
          const lines = text.split('\n');
          lines.forEach(l => {
            if (l.includes('service_role')) console.log('  ', l.trim());
          });
        }
      } catch (e) {}
    }
  }
}

findInDir('.');
