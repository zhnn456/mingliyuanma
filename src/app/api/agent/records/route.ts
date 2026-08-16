import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll } from '@/lib/d1';
import { requireAgent } from '@/lib/auth-server';

/**
 * 代理商排盘记录 API
 * 返回当前代理商名下客户（SiteConfig agent_customer 关联）的四大命理排盘记录
 * GET /api/agent/records?type=bazi&startDate=...&endDate=...&page=1&pageSize=20
 */

type RecordType = 'bazi' | 'ziwei' | 'qimen' | 'meihua';

const typeMeta: Record<RecordType, { table: string; label: string; alias: string; nameCol: string; extraCols: string }> = {
  bazi: {
    table: 'BaziRecord',
    label: '八字',
    alias: 'br',
    nameCol: 'br.name',
    extraCols: 'br.gender, br.birthDate, br.birthTime',
  },
  ziwei: {
    table: 'ZiweiRecord',
    label: '紫微',
    alias: 'zr',
    nameCol: "''",
    extraCols: 'zr.gender, zr.birthDate, zr.birthTime',
  },
  qimen: {
    table: 'QimenRecord',
    label: '奇门',
    alias: 'qr',
    nameCol: "''",
    extraCols: "'' as gender, qr.queryTime as birthDate, '' as birthTime",
  },
  meihua: {
    table: 'MeihuaRecord',
    label: '梅花',
    alias: 'mr',
    nameCol: "''",
    extraCols: "'' as gender, mr.input as birthDate, mr.method as birthTime",
  },
};

function buildUnionSql(
  tables: RecordType[],
  customerIds: string[],
  startDate: string,
  endDate: string
): { sql: string; params: any[]; countParts: Array<{ sql: string; params: any[] }> } {
  const placeholders = customerIds.map(() => '?').join(',');
  const unionParts: string[] = [];
  const params: any[] = [];
  const countParts: Array<{ sql: string; params: any[] }> = [];

  for (const t of tables) {
    const meta = typeMeta[t];
    const escapedTable = `"${meta.table}"`;

    const selectSql =
      `SELECT ${meta.alias}.id, ${meta.alias}.userId, ${meta.nameCol} as name, ${meta.extraCols}, ${meta.alias}.createdAt, ` +
      `u.name as userName, u.email as userEmail, u.phone as userPhone, '${meta.label}' as type ` +
      `FROM ${escapedTable} ${meta.alias} LEFT JOIN User u ON ${meta.alias}.userId = u.id ` +
      `WHERE ${meta.alias}.userId IN (${placeholders})`;

    const condSql = selectSql
      + (startDate ? ` AND ${meta.alias}.createdAt >= ?` : '')
      + (endDate ? ` AND ${meta.alias}.createdAt <= ?` : '');

    // 参数顺序与占位符一一对应：本表的 IN 客户列表 + 本表日期条件
    params.push(...customerIds);
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);

    unionParts.push(`(${condSql})`);

    const countSql =
      `SELECT COUNT(*) as total FROM ${escapedTable} WHERE userId IN (${placeholders})`
      + (startDate ? ` AND createdAt >= ?` : '')
      + (endDate ? ` AND createdAt <= ?` : '');
    const countParams: any[] = [...customerIds];
    if (startDate) countParams.push(startDate);
    if (endDate) countParams.push(endDate);
    countParts.push({ sql: countSql, params: countParams });
  }

  const sql = unionParts.join(' UNION ALL ');
  return { sql, params, countParts };
}

export async function GET(req: NextRequest) {
  try {
    const { allowed, session } = await requireAgent(req);
    if (!allowed || !session) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const agent = await queryFirst('SELECT * FROM Agent WHERE userId = ?', session.sub);
    if (!agent) {
      return NextResponse.json({ error: '代理商信息不存在' }, { status: 404 });
    }

    // 获取名下客户（与 agent/customers 同一归因：SiteConfig agent_customer 关联）
    const customerLinks = await queryAll(
      'SELECT * FROM SiteConfig WHERE category = ? AND value = ?',
      'agent_customer', (agent as any).id
    );
    const customerIds = customerLinks.map((c: any) => c.key.replace('agent_customer:', ''));

    if (customerIds.length === 0) {
      return NextResponse.json({ records: [], total: 0, page: 1, pageSize: 20 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20') || 20, 100);
    const offset = (page - 1) * pageSize;
    const type = searchParams.get('type') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const allTypes: RecordType[] = ['bazi', 'ziwei', 'qimen', 'meihua'];
    const tables: RecordType[] = type && (allTypes as string[]).includes(type) ? [type as RecordType] : allTypes;

    const { sql, params, countParts } = buildUnionSql(tables, customerIds, startDate, endDate);

    // LIMIT/OFFSET 用字符串拼接（mysql2 对 ? 占位符处理 LIMIT 会报错，参数已 parseInt 校验）
    const listSql = `${sql} ORDER BY createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`;
    const records = await queryAll(listSql, ...customerIds, ...params);

    let total = 0;
    for (const part of countParts) {
      const r = await queryFirst(part.sql, ...part.params);
      total += (r as any)?.total || 0;
    }

    return NextResponse.json({
      records: records.map((r: any) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('获取代理商排盘记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
