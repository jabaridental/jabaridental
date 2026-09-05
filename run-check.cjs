const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('node node_modules/typescript/bin/tsc --noEmit --skipLibCheck --project tsconfig.json', {
    encoding: 'utf8',
    timeout: 120000,
    cwd: __dirname
  });
  fs.writeFileSync('tsc-result.txt', 'PASS\n' + out);
  console.log('TSC PASSED');
} catch(e) {
  const msg = (e.status !== undefined ? `FAIL exit ${e.status}\n` : 'TIMEOUT\n') + (e.stdout || e.stderr || 'no output');
  fs.writeFileSync('tsc-result.txt', msg);
  console.log(msg.substring(0, 2000));
}
