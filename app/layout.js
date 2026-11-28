import './globals.css';
import { headers } from 'next/headers';
import { getLocaleConfig } from '@/lib/locales';

export const metadata = {
  title: 'RK GEM AI — Free AI Chat & Studio',
  description:
    'RK GEM AI is a free, open-source AI chat and media studio. Switch between Ollama, OpenRouter, Groq and Google Gemini with your own key. Built by Krishn Gupta & Riya Gupta.',
  applicationName: 'RK GEM AI',
  authors: [{ name: 'Krishn Gupta' }, { name: 'Riya Gupta' }],
  keywords: ['RK GEM AI', 'free ai chat', 'openrouter free models', 'ollama', 'groq', 'gemini', 'ai studio'],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    title: 'RK GEM AI — Free AI Chat & Studio',
    description: 'Free models, your own provider, zero subscription. Built by Krishn Gupta & Riya Gupta.',
    siteName: 'RK GEM AI',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#060608',
  // Phone par layout ko device width par lock karo. Iske bina mobile browser
  // 980px ki desktop width assume karta hai aur boxes screen se bahar nikal
  // jaate hain ("sizing/bleed" problem).
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }) {
  // Locale is derived from the URL path by middleware.js and passed
  // through as a plain response header — the root layout is shared by
  // every locale's route tree, so it can't take a `locale` prop directly.
  const headerList = await headers();
  const { htmlLang } = getLocaleConfig(headerList.get('x-locale'));

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint to avoid a dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
