// Templates: hosted key ke bina, apne GPU par chalte hain.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');

test('template catalog is valid and uses real workflow ids', async () => {
  const { GPU_TEMPLATES } = await import('../lib/templates.js');
  const { WORKFLOWS } = await import('../lib/workflows.js');
  assert.ok(GPU_TEMPLATES.length >= 8, 'need at least 8 templates');
  for (const t of GPU_TEMPLATES) {
    assert.ok(WORKFLOWS[t.workflowId], `${t.id} uses unknown workflow ${t.workflowId}`);
    assert.ok(t.params?.prompt, `${t.id} has no prompt`);
    assert.ok(['image', 'video'].includes(t.kind), `${t.id} bad kind`);
  }
  assert.ok(GPU_TEMPLATES.some((t) => t.kind === 'video'), 'no video templates');
});

test('templates page exists and renders cards from the catalog', () => {
  assert.ok(existsSync(join(root, 'app/templates/page.js')), 'templates route missing');
  const c = read('components/TemplatesClient.js');
  assert.match(c, /GPU_TEMPLATES/, 'page does not use the catalog');
  assert.match(c, /api\/rk\/comfy\/render/, 'page does not call the GPU render API');
  assert.ok(!/apiKey/.test(c), 'templates must not require a hosted API key');
});

test('sidebar links Templates', () => {
  const shell = read('components/StandaloneShell.js');
  assert.match(shell, /href="\/templates"/, 'no sidebar link to templates');
});
