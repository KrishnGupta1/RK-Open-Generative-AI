import ChatClient from '@/components/ChatClient';

export const metadata = {
  title: 'Chat — RK GEM AI',
  description: 'Free AI chat with Ollama, OpenRouter, Groq and Gemini. Bring your own key, switch models anytime.',
};

export default function ChatPage() {
  return <ChatClient />;
}
