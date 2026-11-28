// GPU connect: stale localhost, smart paste, /gpu guide.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');

test('stale localhost endpoint is cleared, not reused', () => {
  const c = read('components/StudioRemoteClient.js');
  assert.match(c, /isLocal/, 'no localhost guard when reading saved endpoint');
  assert.match(c, /localhost nahi chalega/, 'no plain-language message for localhost');
});

test('smart paste extracts tunnel URL from a pasted log', async () => {
  const src = read('components/StudioRemoteClient.js');
  const fn = src.match(/export function extractEndpoint[\s\S]*?\n}\n/)[0].replace('export ', '');
  // eslint-disable-next-line no-new-func
  const extract = new Function(`${fn}; return extractEndpoint;`)();
  assert.equal(extract('✅ STUDIO URL: https://abc-def.trycloudflare.com'), 'https://abc-def.trycloudflare.com');
  assert.equal(extract('https://x.lhr.life/'), 'https://x.lhr.life');
  assert.equal(extract('http://127.0.0.1:8188'), null, 'localhost must never be accepted');
  assert.equal(extract('hello world'), null);
});

test('/gpu guide page exists with code + troubleshooting', () => {
  assert.ok(existsSync(join(root, 'app/gpu/page.js')), '/gpu route missing');
  const c = read('components/GpuSetupClient.js');
  assert.match(c, /navigator\.clipboard\.writeText/, 'no copy button for the script');
  assert.match(c, /GPU T4 x2/, 'no accelerator instruction');
  assert.match(c, /Internet = ON|Internet ON/, 'no internet instruction');
  assert.match(c, /Troubleshoot|Kuch galat|rk-table/, 'no troubleshooting section');
  assert.match(read('components/StandaloneShell.js'), /href="\/gpu"/, 'sidebar has no GPU link');
});
