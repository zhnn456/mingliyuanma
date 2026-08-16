import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, execute } from '@/lib/d1';

/** 自动建表（ContactMessage） */
async function ensureTable() {
  await execute(`CREATE TABLE IF NOT EXISTS ContactMessage (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reply TEXT,
    repliedBy VARCHAR(64),
    repliedAt DATETIME NULL,
    clientIP VARCHAR(100),
    userAgent TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  await execute('CREATE INDEX IF NOT EXISTS idx_cm_status ON ContactMessage(status)');
  await execute('CREATE INDEX IF NOT EXISTS idx_cm_createdAt ON ContactMessage(createdAt)');
}

const SUBJECT_LABELS: Record<string, string> = {
  suggestion: '功能建议',
  bug: '问题反馈',
  cooperation: '合作咨询',
  source: '源码部署咨询',
  other: '其他',
};

export async function POST(req: NextRequest) {
  await ensureTable();

  try {
    const body = await req.json();
    const name = (body.name || '').toString().trim().slice(0, 100);
    const email = (body.email || '').toString().trim().slice(0, 200);
    const subjectKey = (body.subject || '').toString().trim();
    const content = (body.content || '').toString().trim().slice(0, 5000);

    if (!name || !email || !subjectKey || !content) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    const subject = SUBJECT_LABELS[subjectKey] || subjectKey;
    const id = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                      req.headers.get('x-real-ip') || 'unknown';
    const userAgent = (req.headers.get('user-agent') || '').slice(0, 500);

    await execute(
      `INSERT INTO ContactMessage (id, name, email, subject, content, status, clientIP, userAgent, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())`,
      id, name, email, subject, content, clientIP, userAgent
    );

    return NextResponse.json({
      success: true,
      id,
      message: '消息已提交，我们会尽快与您联系',
    });
  } catch (err: any) {
    console.error('[contact] submit error:', err);
    return NextResponse.json({ error: '提交失败，请稍后重试' }, { status: 500 });
  }
}

/** 联系页面配置（公开） */
export async function GET() {
  return NextResponse.json({
    subjects: [
      { value: 'suggestion', label: '功能建议' },
      { value: 'bug', label: '问题反馈' },
      { value: 'cooperation', label: '合作咨询' },
      { value: 'source', label: '源码部署咨询' },
      { value: 'other', label: '其他' },
    ],
    contactEmail: process.env.CONTACT_EMAIL || 'support@ming8.online',
    workHours: '工作日 9:00 - 18:00',
  });
}
