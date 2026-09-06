import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const sql = readFileSync(new URL('./fix-media-urls.sql', import.meta.url), 'utf8')
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Executing ${sql.length} SQL statements against production D1...\n`);

for (const stmt of sql) {
  const short = stmt.length > 80 ? stmt.slice(0, 80) + '...' : stmt;
  console.log(`  → ${short}`);
  try {
    const out = execSync(`npx wrangler d1 execute jabari-dental-db --remote --command="${stmt.replace(/"/g, '\\"')}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 60000
    });
    const match = out.match(/changes["']?\s*:\s*(\d+)/);
    console.log(`    ${match ? `✓ ${match[1]} rows changed` : '✓ done'}`);
  } catch (e) {
    console.log(`    ✗ ${e.stderr?.trim() || e.message}`);
  }
}

console.log('\nDone.');
