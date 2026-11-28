// Crash boundary + local DB + agent safe mode.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p), 'utf8');

test('error boundary exists and handles stale chunks', () => {
  assert.ok(existsSync(join(root, 'app/error.js')), 'app/error.js missing');
  const e = read('app/error.js');
  assert.match(e, /ChunkLoadError/, 'stale chunk detector missing');
  assert.match(e, /location\.reload/, 'no auto reload');
  assert.match(e, /sessionStorage/, 'no reload-loop guard');
  assert.ok(existsSync(join(root, 'app/global-error.js')), 'global-error missing');
});

test('local DB supports export/import + stats', async () => {
  const mod = await import('../lib/rkdb.js');
  const { rkdb } = mod;
  assert.equal(typeof rkdb.insert, 'function');
  assert.equal(typeof rkdb.exportJSON, 'function');
  assert.equal(typeof rkdb.importJSON, 'function');
  const s = rkdb.stats();
  assert.ok('creations' in s && 'gpus' in s && 'sizeKB' in s);
  const json = rkdb.exportJSON();
  const parsed = JSON.parse(json);
  assert.equal(parsed.version, 1);
  assert.ok(parsed.tables);
});

test('library page + sidebar link', () => {
  assert.ok(existsSync(join(root, 'app/library/page.js')), '/library route missing');
  const c = read('components/LibraryClient.js');
  assert.match(c, /rkdb/, 'library does not use the local DB');
  assert.match(c, /Backup|exportJSON/, 'no backup');
  assert.match(read('components/StandaloneShell.js'), /href="\/library"/, 'no sidebar link');
});

test('agent never crashes ComfyUI when its imports fail', () => {
  const a = read('docs/rkgem_agent.py');
  assert.match(a, /_IMPORT_ERROR/, 'no guarded import');
  assert.match(a, /agent OFF — import fail/, 'no warning line');
  assert.match(a, /def _route\(/, 'no safe route decorator');
  // decorator ke roop me (@ROUTES.xxx) koi route nahi hona chahiye
  assert.ok(!/@ROUTES\.(get|post|put|delete)/.test(a), 'raw @ROUTES. decorator will crash in safe mode');
});
