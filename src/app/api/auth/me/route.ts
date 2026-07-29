import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    return NextResponse.json({ user: session?.user || null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
