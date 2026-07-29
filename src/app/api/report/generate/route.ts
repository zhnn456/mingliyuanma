import { getSession } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { generateReportData, checkReportAccess, ReportType, REPORT_CONFIG } from '@/lib/pdf';
import { requireAuth } from '@/lib/security';
import { auditLog } from '@/lib/audit';

/**
 * 生成报告数据
 * GET /api/report/generate?type=bazi&recordId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAuth();
    if (!allowed || !session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as ReportType;
    const recordId = searchParams.get('recordId');

    if (!type || !recordId) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    if (!['bazi', 'ziwei', 'qimen', 'meihua'].includes(type)) {
      return NextResponse.json({ error: '无效的报告类型' }, { status: 400 });
    }

    const userId = session?.user?.id;

    // 检查访问权限
    const access = await checkReportAccess(userId, type, recordId);
    if (!access.allowed) {
      return NextResponse.json({
        error: access.reason || '无权访问',
        needPayment: access.needPayment,
        price: access.price,
      }, { status: 403 });
    }

    // 生成报告数据
    const reportData = await generateReportData(type, recordId, userId);
    if (!reportData) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    }

    // 审计日志
    await auditLog({
      userId,
      action: 'pdf_generate',
      details: { type, recordId, reportId: reportData.reportId },
      status: 'success',
    });

    return NextResponse.json({
      report: reportData,
      config: REPORT_CONFIG[type],
    });
  } catch (error) {
    console.error('生成报告失败:', error);
    return NextResponse.json({ error: '生成报告失败' }, { status: 500 });
  }
}
