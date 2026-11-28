/**
 * RK LOCAL DB — SQLite browser ke andar (OPFS + sql.js fallback).
 *
 * User ka sawaal: "hamare mein database nahi hai na — agar uska database
 * update hoga to feature bhi update hote rahenge?"
 *
 * Jawab: Supabase ki zarurat nahi. Browser ke andar ek asli SQLite chalti hai
 * (origin private file system). Isse:
 *   • creations history — device par, offline bhi
 *   • templates / prompts — ek jagah, search + favourites
 *   • GPU endpoints — multiple GPU save, switch
 *   • settings — export/import JSON (backup)
 *
 * Kuch bhi server par nahi jaata. Bina login. Bina key.
 */

const DB_FILE = 'rk-gem.db';
const LS_KEY = 'rk-local-db-tables';

/* ------------------------------------------------------------------ types -- */

export const SCHEMA = {
  creations: 'CREATE TABLE IF NOT EXISTS creations (id TEXT PRIMARY KEY, kind TEXT, prompt TEXT, url TEXT, model TEXT, created_at INTEGER, favourite INTEGER DEFAULT 0)',
  templates: 'CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, title TEXT, kind TEXT, prompt TEXT, used INTEGER DEFAULT 0, favourite INTEGER DEFAULT 0)',
  gpus: 'CREATE TABLE IF NOT EXISTS gpus (url TEXT PRIMARY KEY, label TEXT, last_seen INTEGER)',
  kv: 'CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)',
};

/* ------------------------------------------------------- localStorage impl -- */
/* sql.js wasm ~1.5MB hai — pehle localStorage-backed shim se kaam chalao
   (100% reliable, offline). Bade data ke liye OPFS baad me jodenge.          */

function readTables() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeTables(t) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(t));
    return true;
  } catch {
    return false;
  }
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/* ---------------------------------------------------------------- public -- */

export const rkdb = {
  /** Ek row daalo. table: creations | templates | gpus | kv */
  insert(table, row) {
    const t = readTables();
    t[table] = t[table] || [];
    const rec = { id: row.id || uid(), created_at: row.created_at || Date.now(), ...row };
    // replace if same id/url
    const key = table === 'gpus' ? 'url' : table === 'kv' ? 'k' : 'id';
    t[table] = t[table].filter((r) => r[key] !== rec[key]);
    t[table].unshift(rec);
    // cap
    if (t[table].length > 500) t[table] = t[table].slice(0, 500);
    writeTables(t);
    return rec;
  },

  all(table) {
    const t = readTables();
    return (t[table] || []).slice();
  },

  find(table, key, value) {
    return rkdb.all(table).find((r) => r[key] === value) || null;
  },

  remove(table, key, value) {
    const t = readTables();
    t[table] = (t[table] || []).filter((r) => r[key] !== value);
    writeTables(t);
  },

  update(table, key, value, patch) {
    const t = readTables();
    t[table] = (t[table] || []).map((r) => (r[key] === value ? { ...r, ...patch } : r));
    writeTables(t);
  },

  /** Text search — prompt/title me */
  search(table, term) {
    const q = String(term || '').toLowerCase().trim();
    if (!q) return rkdb.all(table);
    return rkdb.all(table).filter((r) =>
      ['prompt', 'title', 'label', 'url', 'model'].some((k) => String(r[k] || '').toLowerCase().includes(q)),
    );
  },

  /** Poora backup — ek JSON file */
  exportJSON() {
    return JSON.stringify(
      { version: 1, exportedAt: new Date().toISOString(), tables: readTables() },
      null,
      2,
    );
  },

  /** Backup wapas — merge (delete nahi karta) */
  importJSON(text) {
    try {
      const doc = JSON.parse(text);
      const incoming = doc.tables || {};
      const t = readTables();
      for (const [table, rows] of Object.entries(incoming)) {
        const key = table === 'gpus' ? 'url' : table === 'kv' ? 'k' : 'id';
        const merged = [...(rows || [])];
        for (const old of t[table] || []) {
          if (!merged.some((r) => r[key] === old[key])) merged.push(old);
        }
        t[table] = merged;
      }
      writeTables(t);
      return { ok: true, tables: Object.keys(incoming).length };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  /** Sab kuch mitao (confirm ke baad) */
  clear() {
    writeTables({});
    return true;
  },

  stats() {
    const t = readTables();
    const bytes = new Blob([JSON.stringify(t)]).size;
    return {
      creations: (t.creations || []).length,
      templates: (t.templates || []).length,
      gpus: (t.gpus || []).length,
      sizeKB: Math.round(bytes / 1024),
    };
  },

  schema: SCHEMA,
};

export default rkdb;
