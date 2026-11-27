// Model catalog integrity: the Models tab types these values straight into
// ComfyUI loader nodes, so a bad filename or https URL must fail here, not on
// a user's GPU.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MODEL_LIST, MODELS_BY_ID, validateModelId, decorateModels } from '../lib/modelControl.js';

const SAFE_FOLDER = /^[a-z_]+$/;

test('catalog ids are unique and resolvable', () => {
  const ids = MODEL_LIST.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate model id');
  for (const id of ids) assert.equal(validateModelId(id).id, id);
  assert.equal(validateModelId('nope'), null);
  assert.equal(validateModelId('__proto__'), null);
});

test('every model is downloadable over https from a known host', () => {
  for (const m of MODEL_LIST) {
    const url = new URL(m.url);
    assert.equal(url.protocol, 'https:', `${m.id} must be https`);
    assert.ok(
      /(^|\.)huggingface\.co$/.test(url.hostname),
      `${m.id} host must be huggingface.co, got ${url.hostname}`,
    );
    assert.ok(m.filename.endsWith('.safetensors') || m.filename.endsWith('.gguf'), `${m.id} filename`);
  }
});

test('filenames are basenames and folders are safe to join', () => {
  for (const m of MODEL_LIST) {
    assert.equal(m.filename, m.filename.split('/').pop(), `${m.id} filename must be a basename`);
    assert.ok(!m.filename.startsWith('.'), `${m.id} hidden file`);
    assert.match(m.folder, SAFE_FOLDER, `${m.id} folder`);
  }
});

test('sizes are sane and helpers are declared', () => {
  for (const m of MODEL_LIST) {
    assert.ok(m.sizeGB > 0 && m.sizeGB < 40, `${m.id} sizeGB`);
    assert.ok(m.vramGB > 0, `${m.id} vramGB`);
    for (const dep of m.requires) assert.ok(MODELS_BY_ID[dep], `${m.id} requires unknown ${dep}`);
    assert.ok(m.totalGB >= m.sizeGB, `${m.id} totalGB covers itself`);
  }
});

test('decorateModels marks installed + missing helpers correctly', () => {
  const rows = decorateModels({
    files: { ckpt_name: ['sd_xl_base_1.0.safetensors'], unet_name: [], clip_name: [], vae_name: [] },
  });
  const base = rows.find((r) => r.id === 'sdxl-base');
  assert.equal(base.installed, true);
  assert.equal(base.ready, true);

  const wan = rows.find((r) => r.id === 'wan21-t2v-1.3b');
  assert.equal(wan.installed, false);
  assert.equal(wan.ready, false);
  assert.deepEqual(wan.missingHelpers.sort(), ['umt5-xxl', 'wan-vae']);

  const none = decorateModels(null);
  assert.ok(none.every((r) => r.installed === false));
});
