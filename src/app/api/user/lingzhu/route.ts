import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const m = cookie.match(/token=([^;]+)/);
    if (!m) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const payload = JSON.parse(new TextDecoder().decode(new Uint8Array(atob(decodeURIComponent(m[1])).split('').map(c => c.charCodeAt(0)))));
    if (!payload?.sub) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const db = ctx.env.DB;

    const row = await db.prepare('SELECT balance FROM UserPoints WHERE userId = ?').bind(payload.sub).first() as any;
    const balance = row?.balance || 0;

    const rows = await db.prepare('SELECT * FROM PointsLedger WHERE userId = ? ORDER BY createdAt DESC LIMIT 20').bind(payload.sub).all() as any;
    return NextResponse.json({ balance, rows: rows.results || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
