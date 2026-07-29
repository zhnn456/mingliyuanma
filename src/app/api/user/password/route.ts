import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security';
import { hashPassword, verifyPassword } from '@/lib/password';
import { execute, queryFirst } from '@/lib/d1';

export async function PUT(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await req.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码至少6位' }, { status: 400 });
    }

    const user = await queryFirst('SELECT passwordHash FROM User WHERE id = ?', session.user.id) as any;
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

    // 直接比较（管理员账号硬编码密码）
    const isAdmin = session.user.email === '282063152@qq.com';
    let valid = false;
    if (isAdmin) {
      valid = oldPassword === 'admin123';
    } else {
      valid = await verifyPassword(oldPassword, user.passwordHash);
    }

    if (!valid) {
      return NextResponse.json({ error: '当前密码错误' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await execute('UPDATE User SET passwordHash = ?, updatedAt = ? WHERE id = ?', newHash, new Date().toISOString(), session.user.id);

    return NextResponse.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json({ error: '修改失败' }, { status: 500 });
  }
}
