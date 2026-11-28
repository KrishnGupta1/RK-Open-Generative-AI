// Universal layout rails: no size/overlap/bleed regressions on any device.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');
const css = read('app/globals.css');
const shell = read('components/StandaloneShell.js');

test('viewport-safe height + no 100vh-only shell', () => {
  assert.match(shell, /100svh/, 'shell must use svh so mobile browser chrome does not clip');
  assert.ok(!/className="h-screen bg-\[#030303\]/.test(shell), 'old h-screen shell is back');
});

test('no horizontal bleed: global overflow + min-width rails', () => {
  assert.match(css, /overflow-x:\s*clip/, 'html/body overflow-x clip missing');
  assert.match(css, /\*\s*\{\s*min-width:\s*0;/, 'global min-width:0 missing');
  assert.match(css, /img,\s*video,\s*canvas,\s*svg\s*\{\s*max-width:\s*100%/, 'media max-width rail missing');
});

test('studio panels collapse on phones (no 400px sidebar stuck)', () => {
  const audio = read('packages/studio/src/components/AudioStudio.jsx');
  assert.match(audio, /rk-studio-audio/, 'audio root not tagged');
  assert.ok(!/w-full lg:w-\[400px\][^"]*absolute bottom-0/.test(audio), 'audio gen bar still absolute over content');
  assert.match(css, /\.rk-studio-audio[^}]*flex-direction:\s*column/s, 'audio does not stack on mobile');
});

test('header fits a 360px screen', () => {
  assert.match(css, /@media \(max-width: 480px\)/, 'small-phone header rules missing');
  assert.match(css, /\.rk-balance-pill \{ display: none/, 'balance pill still squeezes tiny headers');
  assert.match(shell, /rk-shell-header/, 'header not tagged');
});

test('no cyan anywhere in the shell (red/gold only)', () => {
  assert.ok(!/cyan-/.test(shell), 'cyan utility classes are back in the shell');
  assert.ok(!/#818cf8|#c084fc/.test(shell), 'indigo/violet gradient is back in the shell logo');
});

test('GPU connection state is always visible + auto-checked', () => {
  const c = read('components/StudioRemoteClient.js');
  assert.match(c, /rk-gpu-status/, 'no GPU status banner');
  assert.match(c, /GPU juda hua hai/, 'no plain-language connected message');
  assert.match(c, /window\.addEventListener\('focus'/, 'no re-check on focus');
  assert.match(read('app/api/rk/comfy/ping/route.js'), /vram/, 'ping does not report VRAM');
});

test('tablet, landscape and desktop-site rails exist', () => {
  assert.match(css, /max-height: 500px\) and \(orientation: landscape\)/, 'landscape rail missing');
  assert.match(css, /min-width: 768px\) and \(max-width: 1023px\)/, 'tablet rail missing');
  assert.match(css, /min-width: 1536px/, 'large-desktop rail missing');
});
