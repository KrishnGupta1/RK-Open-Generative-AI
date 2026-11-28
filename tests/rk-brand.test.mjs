import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const brand = readFileSync(new URL('../lib/brand.js', import.meta.url), 'utf8');

test('brand carries founder and co-founder credits', () => {
  assert.match(brand, /Krishn Gupta/);
  assert.match(brand, /Riya Gupta/);
  assert.match(brand, /Founder & CEO/);
  assert.match(brand, /Co-Founder/);
});

test('brand name is RK GEM AI', () => {
  assert.match(brand, /name: 'RK GEM AI'/);
});

test('provider registry covers the four free providers', async () => {
  const { PROVIDERS } = await import('../lib/providers.js');
  for (const id of ['ollama', 'openrouter', 'groq', 'gemini']) {
    assert.ok(PROVIDERS[id], `${id} missing`);
  }
});
