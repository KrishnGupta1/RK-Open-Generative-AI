'use client';

// `/studio-remote` — purana link zinda rahe.
//
// Studio ek hi jagah hai ab: `/studio` ke andar "Apna GPU (Free)" tab.
// Ye page wahi tab khol deta hai, taaki bookmarks aur docs ke links
// (KAGGLE-SIMPLE.md etc.) kaam karte rahein.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudioRemoteRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/studio/apna-gpu');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050506] text-white flex flex-col items-center justify-center gap-3 px-6">
      <div className="h-8 w-8 rounded-full border-2 border-[#ef2b3d]/25 border-t-[#ef2b3d] animate-spin" />
      <p className="text-sm text-white/50">Apna GPU studio khul raha…</p>
    </div>
  );
}
