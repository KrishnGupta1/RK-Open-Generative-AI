// Mobile sizing + "one studio" contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');

test('viewport locks to device width (mobile bleed fix)', () => {
  const layout = read('app/layout.js');
  assert.match(layout, /width:\s*'device-width'/, 'viewport width missing');
  assert.match(layout, /initialScale:\s*1/, 'initialScale missing');
});

test('css contains the mobile guard rails', () => {
  const css = read('app/globals.css');
  assert.match(css, /overflow-x:\s*hidden/, 'no horizontal-scroll guard');
  assert.match(css, /img, video, canvas, svg, table/, 'media max-width guard missing');
  assert.match(css, /@media \(max-width: 640px\)/, 'phone breakpoint missing');
  assert.match(css, /rk-gpu-body \{ grid-template-columns: 1fr/, 'GPU body must collapse to one column');
});

test('GPU studio is a tab inside the one studio, not a second app', () => {
  const shell = read('components/StandaloneShell.js');
  assert.match(shell, /id: 'apna-gpu'/, 'apna-gpu tab missing from studio');
  assert.match(shell, /<StudioRemoteClient embedded \/>/, 'embedded studio missing');
  const client = read('components/StudioRemoteClient.js');
  assert.match(client, /embedded = false/, 'embedded prop missing');
  assert.match(client, /is-embedded/, 'embedded styling hook missing');
});

test('/studio-remote is only a redirect into the tab', () => {
  const page = read('app/studio-remote/page.js');
  assert.match(page, /redirect|replace\('\/studio\/apna-gpu'\)/, 'old route must forward to the tab');
});
