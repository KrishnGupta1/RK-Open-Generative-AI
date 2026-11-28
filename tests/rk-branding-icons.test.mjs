// No vendor branding in user-facing strings + 2026 favicon set + GPU picks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');

test('no vendor name in the key gate / banner', () => {
  for (const f of ['components/ApiKeyModal.js', 'components/StandaloneShell.js']) {
    const s = read(f);
    assert.ok(!/muapi\.ai|Muapi key|Muapi API|Muapi models/i.test(s), `${f} still shows vendor branding`);
  }
});

test('favicon set exists and is valid svg', () => {
  for (const f of ['app/icon.svg', 'app/apple-icon.svg', 'public/favicon.svg']) {
    assert.ok(existsSync(join(root, f)), `${f} missing`);
    const svg = read(f);
    assert.match(svg, /<svg[\s\S]*<\/svg>/, `${f} not svg`);
    assert.ok(!/#22d3ee|#818cf8|#c084fc/i.test(svg), `${f} still uses the old cyan palette`);
    assert.match(svg, /#ef2b3d|#d4a537/i, `${f} missing red/gold`);
  }
  const layout = read('app/layout.js');
  assert.match(layout, /icons:\s*\{/, 'metadata.icons missing');
});

test('GPU-based recommendation picks one model per kind', async () => {
  const { recommendFor } = await import('../lib/modelControl.js');
  assert.equal(recommendFor({ vramGB: 4, kind: 'image' }).id, 'sd15');
  assert.equal(recommendFor({ vramGB: 8, kind: 'image' }).id, 'sdxl-base');
  assert.equal(recommendFor({ vramGB: 16, kind: 'image' }).id, 'flux1-schnell');
  assert.equal(recommendFor({ vramGB: 30, kind: 'video' }).id, 'wan22-t2v-14b');
  assert.equal(recommendFor({ vramGB: 0, kind: 'video' }), null);
});

test('studio connect script has no model download pre-baked', () => {
  const py = read('docs/kaggle-studio-connect.py');
  assert.ok(!/urlretrieve\(f?['"]{1}https:\/\/huggingface/.test(py), 'starter script must not pre-download weights');
  assert.match(py, /rkgem_agent\.py/, 'agent install missing');
  assert.match(py, /--protocol/, 'tunnel protocol flag missing');
});
