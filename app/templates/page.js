import TemplatesClient from '@/components/TemplatesClient';

export const metadata = {
  title: 'Templates — RK GEM AI',
  description: 'One-tap image aur video templates jo aapke apne GPU par chalte hain. Koi API key nahi, koi subscription nahi.',
};

export default function TemplatesPage() {
  return <TemplatesClient />;
}
