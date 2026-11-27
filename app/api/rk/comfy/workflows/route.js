import { NextResponse } from 'next/server';
import { WORKFLOW_LIST } from '@/lib/workflows';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

// GET /api/rk/comfy/workflows → built-in graphs the UI can render with
export async function GET() {
  return NextResponse.json({ workflows: WORKFLOW_LIST });
}
