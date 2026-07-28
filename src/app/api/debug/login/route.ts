import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword, hashPassword } from '@/lib/password';

/**
 * 调试接口 - 测试密码验证
 * GET /api/debug/login?email=xxx&password=xxx
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  const password = req.nextUrl.searchParams.get('password');

  if (!email || !password) {
    return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  }

  try {
    // 1. 查用户
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ step: 'find_user', error: '用户不存在' });
    }

    // 2. 验证密码
    const isValid = user.passwordHash ? await verifyPassword(password, user.passwordHash) : false;

    // 3. 生成一个测试哈希来验证算法
    const testHash = await hashPassword('test123');

    return NextResponse.json({
      step: 'verify_password',
      userExists: true,
      hasHash: !!user.passwordHash,
      hashLength: user.passwordHash?.length || 0,
      isValid,
      cryptoAvailable: typeof globalThis.crypto !== 'undefined',
      subtleAvailable: typeof globalThis.crypto?.subtle !== 'undefined',
    });
  } catch (error: any) {
    return NextResponse.json({
      step: 'error',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    }, { status: 500 });
  }
}
