// Low-end phone guarantees + custom model downloads.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');

test('only the active studio is mounted (16-at-once was the OOM cause)', () => {
  const shell = read('components/StandaloneShell.js');
  assert.match(shell, /LAZY_STUDIOS\[activeTab\]/, 'active-only mount missing');
  assert.ok(
    !/<ImageStudio\s/.test(shell) && !/<VideoStudio\s/.test(shell),
    'studios must not be statically rendered anymore',
  );
  assert.ok(
    /import \{ getUserBalance \} from 'studio'/.test(shell),
    'heavy static imports should be gone (only getUserBalance left)',
  );
});

test('phone css drops expensive paint work', () => {
  const css = read('app/globals.css');
  assert.match(css, /prefers-reduced-motion/, 'reduced-motion support missing');
  // Glass panels par blur band, par chhoti blur chalti rahe (blank look na aaye)
  assert.match(css, /\.glass-panel \{ backdrop-filter: none !important/, 'glass blur must be off on phones');
  // Grids ko forcibly 1-column karna layout todta tha — ab nahi
  assert.ok(!/grid-cols-2[\s\S]{0,80}1fr !important/.test(css), 'forced 1-column grids are back (breaks layout)');
});

test('catalog is bigger and every URL is https huggingface', async () => {
  const { MODEL_LIST } = await import('../lib/modelControl.js');
  assert.ok(MODEL_LIST.length >= 11, `expected >=11 models, got ${MODEL_LIST.length}`);
  for (const m of MODEL_LIST) {
    const u = new URL(m.url);
    assert.equal(u.protocol, 'https:', `${m.id} not https`);
    assert.match(u.hostname, /huggingface\.co$/, `${m.id} host ${u.hostname}`);
  }
});

test('custom link download validates input', () => {
  const src = read('lib/modelControl.js');
  assert.match(src, /custom/, 'custom payload support missing');
  assert.match(src, /Sirf https link chalega/, 'https-only guard missing');
  assert.match(src, /safetensors\|gguf\|ckpt/, 'extension guard missing');
  const route = read('app/api/rk/comfy/models/download/route.js');
  assert.match(route, /body\.custom/, 'route must forward custom payload');
});
