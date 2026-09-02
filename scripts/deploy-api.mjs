/**
 * Deploy worker directly via Cloudflare API using native FormData.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '514cfc328f3cd9b546d808d3e71f0cf9';
const SCRIPT_NAME = 'jabaridental';

if (!API_TOKEN) {
  console.error('CLOUDFLARE_API_TOKEN env var is required');
  process.exit(1);
}

const API_BASE = 'https://api.cloudflare.com/client/v4';

function walkDir(dir, base = dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full, base));
    } else {
      files.push({ full, rel: path.relative(base, full) });
    }
  }
  return files;
}

async function apiFetch(method, apiPath, options = {}) {
  const url = apiPath.startsWith('http') ? apiPath : `${API_BASE}${apiPath}`;
  const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    ...options.headers,
  };
  
  if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  
  const res = await fetch(url, { method, headers, body: options.body });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  
  if (!res.ok || (json.success === false)) {
    console.error(`API error ${res.status}:`, JSON.stringify(json, null, 2));
    throw new Error(`API request failed: ${res.status}`);
  }
  
  return json;
}

async function uploadWorker() {
  const workerDir = path.join(ROOT, 'dist', '_worker.js');
  const files = walkDir(workerDir);
  
  console.log(`Found ${files.length} worker files to upload`);
  
  const form = new FormData();
  
  const metadata = {
    main_module: 'index.js',
    bindings: [
      { name: 'ASSETS', type: 'assets' },
    ],
    compatibility_date: '2025-08-01',
    compatibility_flags: ['nodejs_compat'],
    observability: { enabled: true },
    vars: {
      MEDIA_PUBLIC_BASE_URL: 'https://media.jabaridental.com',
    },
  };
  
  form.set('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }), 'metadata');
  
  for (const file of files) {
    const content = fs.readFileSync(file.full);
    const contentType = file.rel.endsWith('.mjs') || file.rel.endsWith('.js')
      ? 'application/javascript+module'
      : 'application/octet-stream';
    form.set(file.rel, new Blob([content], { type: contentType }), file.rel);
  }
  
  console.log('Uploading worker...');
  
  const result = await apiFetch('PUT', `/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT_NAME}`, {
    body: form,
  });
  
  console.log('Upload result:', JSON.stringify(result, null, 2));
  return result;
}

async function createDeployment() {
  console.log('Creating deployment...');
  const versions = await apiFetch('GET', `/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT_NAME}/versions?per_page=1`);
  const latestVersion = versions.result.items[0];
  
  const result = await apiFetch('POST', `/accounts/${ACCOUNT_ID}/workers/scripts/${SCRIPT_NAME}/deployments`, {
    body: {
      strategy: 'percentage',
      annotations: {
        'workers/message': 'Deployed via deploy-api.mjs',
        'workers/triggered_by': 'api',
      },
      versions: [
        {
          version_id: latestVersion.id,
          percentage: 100,
        }
      ]
    },
  });
  
  console.log('Deployment result:', JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  console.log('=== JABARI DENTAL Worker Deployment ===');
  console.log(`Account: ${ACCOUNT_ID}`);
  console.log(`Script: ${SCRIPT_NAME}`);
  console.log('');
  
  await uploadWorker();
  await createDeployment();
  
  console.log('');
  console.log('=== Deployment complete ===');
  console.log(`Worker URL: https://${SCRIPT_NAME}.workers.dev`);
}

main().catch(err => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
