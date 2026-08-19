/**
 * 数据汇总接口 —— 供中央数据看板抓取（知微阁/命理网）
 *
 * 部署：
 *   1. 复制本文件到 src/app/api/summary/route.ts
 *   2. 在 .env.production 里加 SUMM_TOKEN=你的token（部署时复制到服务器）
 *   3. 按正常流程构建部署（next build + 上传）
 *   4. 验证：https://你的域名/api/summary?token=你的token
 *
 * 输出 JSON 结构（各站统一，看板按此解析）：
 *   { ok, site, ts, today:{revenue,orders,new_users}, month:{revenue,orders},
 *     total:{revenue,orders,users}, daily30:{revenue:{m-d:n},orders:{},new_users:{}},
 *     extras:[{label,value}] }
 */
import { NextRequest, NextResponse } from 'next/server'
import { queryFirst, queryAll } from '@/lib/d1'

const TOKEN = process.env.SUMM_TOKEN || ''

function zeroFill(): Record<string, number> {
  const map: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const k = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    map[k] = 0
  }
  return map
}

async function safeCount(sql: string): Promise<number> {
  try {
    const row = (await queryFirst(sql)) as any
    return Number(row?.c ?? row?.total ?? 0) || 0
  } catch {
    return 0
  }
}

export async function GET(req: NextRequest) {
  if (TOKEN && req.nextUrl.searchParams.get('token') !== TOKEN) {
    return NextResponse.json({ ok: false, error: 'token 不正确' }, { status: 403 })
  }

  try {
    const num = (v: any) => Number(v) || 0

    const todayRev = num((await queryFirst(`SELECT COALESCE(SUM(amount),0) c FROM "Order" WHERE status='paid' AND DATE(paidAt)=CURDATE()`) as any)?.c)
    const todayOrders = num((await queryFirst(`SELECT COUNT(*) c FROM "Order" WHERE status='paid' AND DATE(paidAt)=CURDATE()`) as any)?.c)
    const todayNew = num((await queryFirst(`SELECT COUNT(*) c FROM "User" WHERE DATE(createdAt)=CURDATE()`) as any)?.c)
    const monthRev = num((await queryFirst(`SELECT COALESCE(SUM(amount),0) c FROM "Order" WHERE status='paid' AND DATE_FORMAT(paidAt,'%Y-%m')=DATE_FORMAT(NOW(),'%Y-%m')`) as any)?.c)
    const monthOrders = num((await queryFirst(`SELECT COUNT(*) c FROM "Order" WHERE status='paid' AND DATE_FORMAT(paidAt,'%Y-%m')=DATE_FORMAT(NOW(),'%Y-%m')`) as any)?.c)
    const totalRev = num((await queryFirst(`SELECT COALESCE(SUM(amount),0) c FROM "Order" WHERE status='paid'`) as any)?.c)
    const totalOrders = num((await queryFirst(`SELECT COUNT(*) c FROM "Order" WHERE status='paid'`) as any)?.c)
    const totalUsers = num((await queryFirst(`SELECT COUNT(*) c FROM "User"`) as any)?.c)
    const paidMembers = num((await queryFirst(`SELECT COUNT(*) c FROM "User" WHERE memberLevel IS NOT NULL AND memberLevel <> 'basic'`) as any)?.c)

    const daily30 = { revenue: zeroFill(), orders: zeroFill(), new_users: zeroFill() }
    const revRows = (await queryAll(
      `SELECT DATE_FORMAT(paidAt,'%m-%d') d, SUM(amount) rev, COUNT(*) cnt FROM "Order"
       WHERE status='paid' AND paidAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY d`
    )) as any[]
    for (const r of revRows) {
      if (r?.d && r.d in daily30.revenue) {
        daily30.revenue[r.d] = num(r.rev)
        daily30.orders[r.d] = num(r.cnt)
      }
    }
    const userRows = (await queryAll(
      `SELECT DATE_FORMAT(createdAt,'%m-%d') d, COUNT(*) cnt FROM "User"
       WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY d`
    )) as any[]
    for (const r of userRows) {
      if (r?.d && r.d in daily30.new_users) daily30.new_users[r.d] = num(r.cnt)
    }

    // 自定义指标：四大命理排盘量、供奉记录（表未建时返回 0）
    const extras = [
      { label: '八字排盘', value: await safeCount('SELECT COUNT(*) c FROM BaziRecord') },
      { label: '紫微斗数', value: await safeCount('SELECT COUNT(*) c FROM ZiweiRecord') },
      { label: '奇门遁甲', value: await safeCount('SELECT COUNT(*) c FROM QimenRecord') },
      { label: '梅花易数', value: await safeCount('SELECT COUNT(*) c FROM MeihuaRecord') },
      { label: '供奉记录', value: await safeCount('SELECT COUNT(*) c FROM OfferingRecord') },
      { label: '付费会员', value: paidMembers },
    ]

    return NextResponse.json({
      ok: true,
      site: '知微阁',
      ts: Math.floor(Date.now() / 1000),
      today: { revenue: todayRev, orders: todayOrders, new_users: todayNew },
      month: { revenue: monthRev, orders: monthOrders },
      total: { revenue: totalRev, orders: totalOrders, users: totalUsers },
      daily30,
      extras,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: '汇总查询失败，请查看服务器日志' }, { status: 500 })
  }
}
