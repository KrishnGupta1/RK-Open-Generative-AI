// Route contract: "/" must open the real studio again (original behaviour) and
// the landing page moves to "/home". A silent regression here is exactly what
// makes the deployed app feel "broken", so lock it down.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('/ redirects to /studio (original entry point)', () => {
  const page = read('app/page.js');
  assert.match(page, /redirect\('\/studio'\)/, "app/page.js must redirect to /studio");
});

test('landing page lives at /home', () => {
  assert.ok(existsSync(new URL('../app/home/page.js', import.meta.url)), 'app/home/page.js missing');
  const home = read('app/home/page.js');
  assert.match(home, /RK GEM AI|BRAND/, 'landing page should still be branded');
});

test('next.config does not redirect /home back to /', () => {
  const cfg = read('next.config.mjs');
  assert.ok(
    !/source:\s*'\/home',\s*destination:\s*'\/'/.test(cfg),
    '/home must not redirect to / (would hide the landing page)',
  );
});

test('studio gate offers the free path, not just the paid key', () => {
  const gate = read('components/ApiKeyModal.js');
  assert.match(gate, /studio-remote/, 'gate must link to the free GPU studio');
  assert.match(gate, /Bina key ke/, 'gate must allow browsing without a key');
});
