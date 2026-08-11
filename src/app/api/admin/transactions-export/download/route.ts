import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/d1';

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    let sql = `SELECT p.id, p.orderId, p.userId, p.method, p.amount, p.status,
               p.transactionId, p.paidAt, p.refundAt, p.refundAmount, p.remark,
               p.createdAt, o.orderNo, o.type as orderType, o.status as orderStatus,
               u.email as userEmail, u.name as userName
               FROM "Payment" p
               LEFT JOIN "Order" o ON p.orderId = o.id
               LEFT JOIN "User" u ON p.userId = u.id
               WHERE 1=1`;
    const params: any[] = [];

    if (startDate) { sql += ' AND p.createdAt >= ?'; params.push(startDate); }
    if (endDate) { sql += ' AND p.createdAt <= ?'; params.push(endDate); }
    if (status) { sql += ' AND p.status = ?'; params.push(status); }
    if (type) { sql += ' AND o.type = ?'; params.push(type); }

    sql += ' ORDER BY p.createdAt DESC';

    const transactions = await queryAll(sql, ...params);

    const typeMap: Record<string, string> = { membership: '会员', offering: '供奉', pdf_report: 'PDF', divination: '占卜' };
    const methodMap: Record<string, string> = { wechat: '微信', alipay: '支付宝', points: '灵珠', stripe: 'Stripe', paypal: 'PayPal', cardkey: '卡密' };
    const statusMap: Record<string, string> = { pending: '待支付', paid: '已支付', failed: '失败', refunded: '已退款' };

    const headers = ['交易ID', '订单号', '用户邮箱', '用户名', '类型', '金额', '支付方式', '状态', '交易号', '支付时间', '退款时间', '退款金额', '备注', '创建时间'];
    const rows = transactions.map((t: any) => [
      t.id, t.orderNo || '', t.userEmail || '', t.userName || '',
      typeMap[t.orderType] || t.orderType || '',
      t.amount?.toFixed(2) || '0.00',
      methodMap[t.method] || t.method || '',
      statusMap[t.status] || t.status || '',
      t.transactionId || '',
      t.paidAt ? new Date(t.paidAt).toLocaleString('zh-CN') : '',
      t.refundAt ? new Date(t.refundAt).toLocaleString('zh-CN') : '',
      t.refundAmount?.toFixed(2) || '',
      t.remark || '',
      t.createdAt ? new Date(t.createdAt).toLocaleString('zh-CN') : '',
    ]);

    const csvContent = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const bom = '\uFEFF';
    const fullContent = bom + csvContent;

    return new NextResponse(fullContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="transactions-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('导出交易流水失败:', error);
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}
