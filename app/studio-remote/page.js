import StudioRemoteClient from '@/components/StudioRemoteClient';

export const metadata = {
  title: 'Apna GPU, website se — RK GEM AI',
  description: 'Render images and video on your own GPU from the browser using remote ComfyUI.',
};

export default function StudioRemotePage() {
  return <StudioRemoteClient />;
}
