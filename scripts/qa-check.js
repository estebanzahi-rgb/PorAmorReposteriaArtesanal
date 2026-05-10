#!/usr/bin/env node
/**
 * Full QA check: typecheck + E2E tests.
 * Requires both servers running on :3000 and :3001.
 * Usage: npm run qa
 */
const { execSync } = require('child_process');
const http = require('http');

const ROOT = require('path').resolve(__dirname, '..');

function run(cmd, cwd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: cwd ?? ROOT, stdio: 'inherit' });
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  let failed = false;

  console.log('\n=== TypeScript checks ===');
  try {
    run('npm run typecheck', `${ROOT}/src/frontend`);
    run('npm run typecheck', `${ROOT}/src/backend`);
  } catch {
    console.error('TypeScript check FAILED');
    failed = true;
  }

  const [fe, be] = await Promise.all([checkPort(3000), checkPort(3001)]);
  if (!fe || !be) {
    console.error('\nERROR: Servers not running. Start them first:\n  Backend:  npm run start:dev --prefix src/backend\n  Frontend: npm run dev --prefix src/frontend');
    process.exit(1);
  }

  console.log('\n=== E2E tests (Playwright) ===');
  try {
    run('npm run test:e2e', `${ROOT}/src/frontend`);
  } catch {
    console.error('E2E tests FAILED');
    failed = true;
  }

  if (failed) {
    console.error('\nQA FAILED — fix the errors above before reporting done.');
    process.exit(1);
  }

  console.log('\nQA PASSED — all checks green.');
}

main();
