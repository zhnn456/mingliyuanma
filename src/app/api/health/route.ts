import { NextResponse } from 'next/server';
import { getSystemVersion } from '@/lib/version';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...getSystemVersion(),
  });
}
