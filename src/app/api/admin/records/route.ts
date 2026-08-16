import { requireAdmin } from '@/lib/auth-server';
import { NextRequest, NextResponse } from 'next/server';
import { queryFirst, queryAll } from '@/lib/d1';

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
  startDate: string,
  endDate: string,
  agentId?: string
): { sql: string; params: any[]; countParts: Array<{ sql: string; params: any[] }> } {
  const unionParts: string[] = [];
  const params: any[] = [];
  const countParts: Array<{ sql: string; params: any[] }> = [];

  for (const t of tables) {
    const meta = typeMeta[t];
    const escapedTable = `"${meta.table}"`;

    const selectSql =
      `SELECT ${meta.alias}.id, ${meta.alias}.userId, ${meta.nameCol} as name, ${meta.extraCols}, ${meta.alias}.createdAt, ` +
      `u.name as userName, u.email as userEmail, u.phone as userPhone, u.agentId as agentId, a.companyName as agentName, '${meta.label}' as type ` +
      `FROM ${escapedTable} ${meta.alias} LEFT JOIN User u ON ${meta.alias}.userId = u.id ` +
      `LEFT JOIN Agent a ON u.agentId = a.id WHERE 1=1`;

    const condSql = selectSql
      + (agentId ? ` AND (u.agentId = ? OR u.id IN (SELECT REPLACE(sc.key, 'agent_customer:', '') FROM SiteConfig sc WHERE sc.category = 'agent_customer' AND sc.value = ?))` : '')
      + (startDate ? ` AND ${meta.alias}.createdAt >= ?` : '')
      + (endDate ? ` AND ${meta.alias}.createdAt <= ?` : '');

    if (agentId) params.push(agentId, agentId);
    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);

    unionParts.push(`(${condSql})`);

    const countSql =
      `SELECT COUNT(*) as total FROM ${escapedTable} WHERE 1=1`
      + (agentId ? ` AND (EXISTS (SELECT 1 FROM User uu WHERE uu.id = ${escapedTable}.userId AND uu.agentId = ?) OR userId IN (SELECT REPLACE(sc.key, 'agent_customer:', '') FROM SiteConfig sc WHERE sc.category = 'agent_customer' AND sc.value = ?))` : '')
      + (startDate ? ` AND createdAt >= ?` : '')
      + (endDate ? ` AND createdAt <= ?` : '');
    const countParams: any[] = [];
    if (agentId) countParams.push(agentId, agentId);
    if (startDate) countParams.push(startDate);
    if (endDate) countParams.push(endDate);
    countParts.push({ sql: countSql, params: countParams });
  }

  const sql = unionParts.join(' UNION ALL ');
  return { sql, params, countParts };
}

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const type = searchParams.get('type') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const agentId = searchParams.get('agentId') || '';

    const validTypes: RecordType[] = ['bazi', 'ziwei', 'qimen', 'meihua'];
    const requestedTypes = (type && validTypes.includes(type as RecordType))
      ? [type as RecordType]
      : validTypes;

    // 检查哪些排盘表实际存在（紫微/奇门/梅花功能未上线时表可能未建）
    const existRows = await queryAll(
      `SELECT TABLE_NAME as t FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('BaziRecord','ZiweiRecord','QimenRecord','MeihuaRecord')`
    ) as any[];
    const existingTables = new Set(existRows.map(r => r.t));

    const tables = requestedTypes.filter(t => existingTables.has(typeMeta[t].table));

    // 如果请求的表都不存在，直接返回空
    if (tables.length === 0) {
      return NextResponse.json({ records: [], total: 0, page, pageSize });
    }

    const { sql, params, countParts } = buildUnionSql(tables, startDate, endDate, agentId || undefined);

    // 注意：mysql2 prepared statement 模式下 LIMIT ? OFFSET ? 会报 ER_WRONG_ARGUMENTS，
    // pageSize 和 offset 已 parseInt 为整数，直接拼接安全
    const offset = (page - 1) * pageSize;
    const pagedSql = `${sql} ORDER BY createdAt DESC LIMIT ${pageSize} OFFSET ${offset}`;

    const totalResults = await Promise.all(
      countParts.map(cp => queryFirst(cp.sql, ...cp.params) as Promise<any>)
    );
    const total = totalResults.reduce((sum, r) => sum + (r?.total || 0), 0);

    const records = await queryAll(pagedSql, ...params);

    return NextResponse.json({ records, total, page, pageSize });
  } catch (error) {
    console.error('获取排盘记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
