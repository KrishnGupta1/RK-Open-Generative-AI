// Kaggle script must never hang silently and must be recoverable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const py = readFileSync(join(root, 'docs/kaggle-studio-connect.py'), 'utf8');
const agent = readFileSync(join(root, 'docs/rkgem_agent.py'), 'utf8');

test('every print is flushed (silent hang na ho)', () => {
  // say() use flush=True; raw print( calls should be avoided inside helpers
  assert.match(py, /def say\(msg\):\s*\n\s*print\(msg, flush=True\)/, 'say() with flush missing');
  // sirf say() ke andar wala print allowed hai
  const rawPrints = (py.match(/^\s*print\(/gm) || []).length;
  assert.ok(rawPrints <= 1, `raw print() found (${rawPrints}) — flush nahi hoga`);
});

test('ComfyUI has multiple launch fallbacks + log dumps', () => {
  assert.match(py, /attempts = \[/, 'no fallback launch list');
  assert.match(py, /lowvram/, 'no lowvram fallback');
  assert.match(py, /--cpu/, 'no cpu fallback');
  assert.match(py, /_tail\(os\.path\.join\(WORK, 'comfy-normal\.log'\)/, 'no log dump on failure');
});

test('torch is not reinstalled (Kaggle image already has it)', () => {
  assert.match(py, /skip = \('torch'/, 'torch skip list missing');
});

test('zip fallback if git clone fails', () => {
  assert.match(py, /archive\/refs\/heads\/master\.zip/, 'no zip fallback');
});

test('agent allows the llm folder (coding models) and whitelists', () => {
  assert.match(agent, /ALLOWED_FOLDERS/, 'no folder whitelist');
  assert.match(agent, /"llm"/, 'llm folder not allowed');
  assert.match(agent, /folder not allowed/, 'no rejection message');
});
