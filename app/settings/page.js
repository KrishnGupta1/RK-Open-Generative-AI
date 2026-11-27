import SettingsClient from '@/components/SettingsClient';

export const metadata = {
  title: 'Providers & Keys — RK GEM AI',
  description: 'Connect Ollama, OpenRouter, Groq, Gemini or any OpenAI-compatible endpoint.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
