'use client';

// RK GEM AI — real studio ka welcome gate.
//
// Original studio sabse pehle Muapi API key maangta hai (key ke bina kuch bhi
// generate nahi hota). Hamare paas free options bhi hain, isliye gate par
// teen raaste dete hain:
//
//   1. Apna GPU (free)        → /studio-remote — SDXL + Wan 2.1, ₹0
//   2. Muapi key (paid API)   → original studio ke 200+ models
//   3. Bina key ke ghoomo     → studio dekh lo, key baad me daalna
//
// Ye gate "kuch nahi chalta" wali feeling khatam karta hai: har raaste par
// kuch kaam karta hai.

import { useState } from 'react';
import Link from 'next/link';
import { getCommonCopy } from '@/lib/locales';
import { validateApiKey } from './apiKeyValidation.mjs';

export default function ApiKeyModal({ onSave, onClose, overlay = false, title, subtitle, locale = 'en' }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const copy = getCommonCopy(locale).apiKeyModal;

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateApiKey(key);
    if (result.error) {
      setError(result.value === undefined && !key.trim() ? copy.missingKeyError : result.error);
      return;
    }
    onSave(result.value);
  };

  const skip = () => onSave('rkgem-browse-only');

  const wrapperClass = overlay
    ? 'fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 font-inter animate-fade-in-up'
    : 'min-h-screen bg-[#030303] flex items-center justify-center px-4 py-8 font-inter';

  return (
    <div className={wrapperClass}>
      <div className="w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-xl p-7 sm:p-9 shadow-2xl relative">
        {overlay && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="absolute top-3 right-3 h-8 w-8 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
          >
            ✕
          </button>
        )}

        <div className="flex items-center gap-2 mb-1">
          <span className="h-7 w-7 rounded-lg bg-[#ef2b3d] text-black text-xs font-black flex items-center justify-center">
            RK
          </span>
          <span className="text-xs tracking-[0.18em] text-white/60 font-semibold">GEM AI STUDIO</span>
        </div>

        <h2 className="text-xl font-bold text-white mt-3">{title || 'Studio kholo'}</h2>
        <p className="text-sm text-white/50 mt-1.5 leading-relaxed">
          Studio ke 200+ models Muapi API se chalte hain. Free chalana hai? Pehla option use karo —
          uske liye koi card nahi lagta.
        </p>

        {/* ── Option 1: free GPU ─────────────────────────────────────────── */}
        <Link
          href="/studio-remote"
          className="mt-5 flex items-start gap-3 rounded-xl border border-[#ef2b3d]/40 bg-[#ef2b3d]/8 p-3.5 hover:bg-[#ef2b3d]/14 transition-colors group"
        >
          <span className="text-lg leading-none mt-0.5">🆓</span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-white">Apna GPU — bilkul free</span>
            <span className="block text-[11.5px] text-white/50 mt-0.5 leading-snug">
              SDXL image + Wan 2.1 video. Kaggle ka free GPU, download + gallery sab app me.
            </span>
          </span>
          <span className="text-[#ef2b3d] text-sm mt-0.5 group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>

        {/* ── Option 2: Muapi key ────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="mt-4">
          <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-white/40 mb-2">
            <span>Ya Muapi key daalo</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 normal-case tracking-normal text-white/40">
              paid · 200+ models
            </span>
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(''); }}
            placeholder="muapi_xxxxxxxxxxxxxxxx"
            className="w-full rounded-lg bg-white/[0.04] border border-white/10 focus:border-[#ef2b3d]/60 outline-none px-3.5 py-2.5 text-sm text-white placeholder:text-white/25"
          />
          {error && <p className="text-[11.5px] text-red-400 mt-1.5">{error}</p>}
          <button
            type="submit"
            className="w-full mt-3 rounded-lg bg-white text-black font-semibold text-sm py-2.5 hover:bg-white/90 transition-colors"
          >
            Key se kholo
          </button>
          <p className="text-[10.5px] text-white/30 mt-2 leading-relaxed">
            Key sirf aapke browser me rehti hai (cookie), humare server par nahi jaati.{' '}
            <a
              href="https://muapi.ai"
              target="_blank"
              rel="noreferrer"
              className="text-[#ef2b3d]/70 hover:text-[#ef2b3d] underline underline-offset-2"
            >
              muapi.ai
            </a>{' '}
            se key milti hai.
          </p>
        </form>

        {/* ── Option 3: browse ───────────────────────────────────────────── */}
        <button
          type="button"
          onClick={skip}
          className="w-full mt-3 text-[11.5px] text-white/40 hover:text-white/70 transition-colors"
        >
          Bina key ke studio dekho →
        </button>

        {subtitle && <p className="text-[10.5px] text-white/25 mt-4">{subtitle}</p>}
      </div>
    </div>
  );
}
