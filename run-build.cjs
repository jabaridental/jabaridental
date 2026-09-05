const { execSync } = require('child_process');
const fs = require('fs');
try {
  process.chdir(__dirname);
  // Ensure env vars are available for the build guard in astro.cloudflare.mjs
  const env = { ...process.env };
  if (!env.AUTH_SECRET) env.AUTH_SECRET = 'Q9RObkh5FumPeCWUHAToqVzXIngrD8tYj7SsGKlxi1fpMy4wcvJ0E62LBNd3aZ';
  if (!env.ADMIN_SECRET) env.ADMIN_SECRET = '9CjrWHOzoVRek0PdQGfg';
  env.MEDIA_PUBLIC_BASE_URL = env.MEDIA_PUBLIC_BASE_URL || 'https://media.jabaridental.com';

  const out = execSync('node node_modules/astro/astro.js build --config astro.cloudflare.mjs', {
    encoding: 'utf8',
    timeout: 300000,
    env,
    cwd: __dirname
  });
  fs.writeFileSync('build-result.txt', 'PASS\n' + out);
  console.log('BUILD PASSED');
} catch(e) {
  const msg = (e.status !== undefined ? `FAIL exit ${e.status}\n` : 'TIMEOUT\n') + (e.stdout || e.stderr || 'no output');
  fs.writeFileSync('build-result.txt', msg);
  console.log('BUILD FAILED');
  console.log(msg.substring(0, 3000));
}
