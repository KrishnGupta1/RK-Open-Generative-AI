import LocalClient from '@/components/LocalClient';

export const metadata = {
  title: 'Local Models — RK GEM AI',
  description: 'Run chat, image and video generation on your own machine — free, offline, no API keys.',
};

export default function LocalPage() {
  return <LocalClient />;
}
