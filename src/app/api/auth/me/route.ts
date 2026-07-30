import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (session) {
      return NextResponse.json({
        user: {
          id: session.sub,
          email: session.email,
          name: session.name,
          role: session.role,
          memberLevel: session.memberLevel,
        },
      });
    }
    return NextResponse.json({ user: null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
