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
    nameCol: 'zr.name',
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
  endDate: string
): { sql: string; params: any[]; countParts: Array<{ sql: string; params: any[] }> } {
  const unionParts: string[] = [];
  const params: any[] = [];
  const countParts: Array<{ sql: string; params: any[] }> = [];

  for (const t of tables) {
    const meta = typeMeta[t];
    const escapedTable = `"${meta.table}"`;

    const selectSql =
      `SELECT ${meta.alias}.id, ${meta.alias}.userId, ${meta.nameCol} as name, ${meta.extraCols}, ${meta.alias}.createdAt, ` +
      `u.name as userName, u.email as userEmail, u.phone as userPhone, '${meta.label}' as type ` +
      `FROM ${escapedTable} ${meta.alias} LEFT JOIN User u ON ${meta.alias}.userId = u.id WHERE 1=1`;

    const condSql = selectSql
      + (startDate ? ` AND ${meta.alias}.createdAt >= ?` : '')
      + (endDate ? ` AND ${meta.alias}.createdAt <= ?` : '');

    if (startDate) params.push(startDate);
    if (endDate) params.push(endDate);

    unionParts.push(`(${condSql})`);

    const countSql =
      `SELECT COUNT(*) as total FROM ${escapedTable} WHERE 1=1`
      + (startDate ? ` AND createdAt >= ?` : '')
      + (endDate ? ` AND createdAt <= ?` : '');
    const countParams: any[] = [];
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

    const validTypes: RecordType[] = ['bazi', 'ziwei', 'qimen', 'meihua'];
    const tables = (type && validTypes.includes(type as RecordType))
      ? [type as RecordType]
      : validTypes;

    const { sql, params, countParts } = buildUnionSql(tables, startDate, endDate);

    const pagedSql = `${sql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    const pagedParams = [...params, pageSize, (page - 1) * pageSize];

    const totalResults = await Promise.all(
      countParts.map(cp => queryFirst(cp.sql, ...cp.params) as Promise<any>)
    );
    const total = totalResults.reduce((sum, r) => sum + (r?.total || 0), 0);

    const records = await queryAll(pagedSql, ...pagedParams);

    return NextResponse.json({ records, total, page, pageSize });
  } catch (error) {
    console.error('获取排盘记录失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
