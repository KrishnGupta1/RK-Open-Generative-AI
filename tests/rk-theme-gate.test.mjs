// Two promises the deployed app must keep:
//  1. Studio never blocks behind a paid API key.
//  2. Brand identity is red/gold/black/white — no leftover cyan anywhere.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');

test('studio shell does not gate on an API key', () => {
  const shell = read('components/StandaloneShell.js');
  assert.ok(
    !/if \(!apiKey\) \{\s*return <ApiKeyModal/.test(shell),
    'StandaloneShell must not return the key modal as a hard gate',
  );
  assert.match(shell, /keyless/, 'free-mode banner flag missing');
  assert.match(shell, /studio-remote/, 'banner must point at the free GPU path');
});

test('key modal is optional + closable (overlay)', () => {
  const modal = read('components/ApiKeyModal.js');
  assert.match(modal, /overlay/, 'modal should support overlay mode');
  assert.match(modal, /Bina key ke/, 'must allow skipping');
});

const CYAN = /#(22d3ee|67e8f9|06b6d4|0891b2|0e7490|a5f3fc|cffafe|155e75)/i;
const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'out', 'build', '__pycache__']);
const EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.mjs']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (EXT.has(extname(name))) yield full;
  }
}

test('no cyan left in the brand surfaces', () => {
  const offenders = [];
  for (const dir of ['app', 'components', 'lib', 'src', 'packages/studio/src', 'packages/studio/tailwind.config.js']) {
    let target;
    try {
      target = join(root, dir);
      statSync(target);
    } catch {
      continue;
    }
    const files = statSync(target).isDirectory() ? [...walk(target)] : [target];
    for (const f of files) {
      if (CYAN.test(readFileSync(f, 'utf8'))) offenders.push(f.replace(root, ''));
    }
  }
  assert.deepEqual(offenders, [], `cyan leftovers: ${offenders.join(', ')}`);
});

test('red/gold tokens exist', () => {
  const css = read('app/globals.css');
  assert.match(css, /--rk-red:/);
  assert.match(css, /--rk-gold:/);
  assert.match(css, /--rk-grad:/);
});
