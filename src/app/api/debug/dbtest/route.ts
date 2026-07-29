import { NextResponse } from 'next/server';
import { getUserPoints } from '@/lib/d1';

export async function GET() {
  try {
    const result = await getUserPoints('cm1admin001');
    return NextResponse.json({ result, ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
