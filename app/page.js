import { redirect } from 'next/navigation';

// `/` = original project jaisa: seedha studio.
//
// Studio ke liye Muapi key chahiye hoti hai, isliye gate par hamare free
// options bhi dikhte hain (Apna GPU = ₹0, SDXL + Wan 2.1). Key na ho to bhi
// user atakta nahi — `/studio-remote` se free chala sakta hai.
//
// Landing page (branding, providers, hosting) `/home` par hai.
export default function Home() {
  redirect('/studio');
}
