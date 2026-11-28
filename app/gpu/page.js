import { readFile } from 'node:fs/promises';
import path from 'node:path';
import GpuSetupClient from '@/components/GpuSetupClient';

export const metadata = {
  title: 'Apna GPU jodo — RK GEM AI',
  description:
    'Kaggle ke free GPU (T4 x2) ko RK GEM AI se jodo. Poora code, screenshots ke saath steps, aur troubleshooting — bilkul free.',
};

async function readScript() {
  try {
    // docs/ me rakha script — build ke time read, taaki page offline bhi kaam kare
    const p = path.join(process.cwd(), 'docs', 'kaggle-studio-connect.py');
    return await readFile(p, 'utf8');
  } catch {
    return '# script nahi mila — docs/kaggle-studio-connect.py dekho';
  }
}

export default async function GpuPage() {
  const script = await readScript();
  return <GpuSetupClient script={script} />;
}
