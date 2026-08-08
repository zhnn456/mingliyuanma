/**
 * 代理商全流程 Mock 测试脚本
 *
 * 模拟：代理商注册 → 邀请客户 → 客户充值 → 自动分润 → 佣金结算
 *
 * 使用方法：
 *   1. 先启动本地 dev server: npm run dev
 *   2. 运行脚本: node scripts/mock-agent-flow.mjs
 *   3. 或指定地址: BASE_URL=http://localhost:3001 node scripts/mock-agent-flow.mjs
 *
 * 环境变量：
 *   BASE_URL       本地 dev server 地址（默认 http://localhost:3000）
 *   ADMIN_EMAIL    管理员邮箱（默认 282063152@qq.com）
 *   ADMIN_PASSWORD 管理员密码（默认 admin123）
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '282063152@qq.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 时间戳后缀，避免邮箱/手机号冲突
const TS = Date.now().toString(36).slice(-6);
const AGENT_EMAIL = `mock-agent-${TS}@test.com`;
const USER_EMAIL = `mock-user-${TS}@test.com`;
const AGENT_PHONE = `138${String(Date.now()).slice(-8).padStart(8, '0')}`;
const USER_PHONE = `139${String(Date.now()).slice(-8).padStart(8, '0')}`;
const PASSWORD = 'Test1234!';

// ============ 工具函数 ============

function log(step, msg, data) {
  const tag = data !== undefined ? '✅' : '⏳';
  console.log(`\n${tag} [${step}] ${msg}`);
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function fail(step, msg) {
  console.error(`\n❌ [${step}] ${msg}`);
  process.exit(1);
}

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Cookie'] = `token=${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json, headers: res.headers };
}

function extractToken(res) {
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

// ============ 主流程 ============

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     代理商全流程 Mock 测试                     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`服务器: ${BASE_URL}`);
  console.log(`代理商: ${AGENT_EMAIL}`);
  console.log(`客户:   ${USER_EMAIL}`);

  // ===== 步骤 1：代理商注册 =====
  log('1', '代理商注册');
  const regRes = await api('POST', '/api/auth/register-agent', {
    email: AGENT_EMAIL,
    password: PASSWORD,
    brandName: 'Mock 测试代理',
    contactName: '测试联系人',
    contactPhone: AGENT_PHONE,
  });

  if (!regRes.ok) {
    fail('1', `代理商注册失败: ${regRes.data.error || regRes.status}`);
  }

  const agentToken = extractToken(regRes);
  const agent = regRes.data.agent;
  log('1', '注册成功', {
    agentId: agent.id,
    referralCode: agent.referralCode,
    licenseKey: agent.licenseKey?.slice(0, 20) + '...',
    level: agent.level,
    commissionRate: agent.commissionRate,
    plan: agent.plan,
  });

  // ===== 步骤 2：代理商信息验证 =====
  log('2', '查询代理商信息');
  const agentInfoRes = await api('GET', '/api/agent/dashboard', null, agentToken);
  if (!agentInfoRes.ok) {
    fail('2', `获取代理商信息失败: ${agentInfoRes.data.error}`);
  }
  log('2', '代理商信息确认', {
    brandName: agentInfoRes.data.agent?.brandName,
    level: agentInfoRes.data.agent?.level,
    commissionRate: agentInfoRes.data.agent?.commissionRate,
  });

  // ===== 步骤 3：客户通过邀请注册 =====
  log('3', '客户注册（绑定代理商）');
  // register API 接受 agentRef（代理商 ID）
  const userRegRes = await api('POST', '/api/user/register', {
    email: USER_EMAIL,
    password: PASSWORD,
    name: '测试客户',
    phone: USER_PHONE,
    agentRef: agent.id,
  });

  if (!userRegRes.ok) {
    fail('3', `客户注册失败: ${userRegRes.data.error}`);
  }
  log('3', '客户注册成功', {
    userId: userRegRes.data.user?.id,
    agentId: userRegRes.data.user?.agentId,
  });

  // ===== 步骤 4：客户登录 =====
  log('4', '客户登录');
  const userLoginRes = await api('POST', '/api/auth/login', {
    email: USER_EMAIL,
    password: PASSWORD,
  });

  if (!userLoginRes.ok) {
    fail('4', `客户登录失败: ${userLoginRes.data.error}`);
  }
  const userToken = extractToken(userLoginRes);
  log('4', '客户登录成功', {
    role: userLoginRes.data.user?.role,
    email: userLoginRes.data.user?.email,
  });

  // ===== 步骤 5：客户充值下单 =====
  log('5', '客户创建充值订单');
  const rechargeRes = await api('POST', '/api/user/recharge', {
    packageId: 'pkg_500', // 500 元 → 550 灵珠
  }, userToken);

  if (!rechargeRes.ok) {
    fail('5', `创建充值订单失败: ${rechargeRes.data.error}`);
  }
  log('5', '订单创建成功', {
    orderId: rechargeRes.data.orderId,
    orderNo: rechargeRes.data.orderNo,
    amount: rechargeRes.data.amount,
    points: rechargeRes.data.points,
  });

  // ===== 步骤 6：模拟支付确认（触发分润）=====
  log('6', '模拟支付确认');
  const payRes = await api('POST', '/api/payment/mock-confirm', {
    orderNo: rechargeRes.data.orderNo,
  }, userToken);

  if (!payRes.ok) {
    fail('6', `支付确认失败: ${payRes.data.error}`);
  }
  log('6', '支付成功', {
    orderNo: payRes.data.order?.orderNo,
    amount: payRes.data.order?.amount,
    status: payRes.data.order?.status,
  });

  // ===== 步骤 7：代理商查询佣金 =====
  log('7', '代理商查询佣金');
  await sleep(500); // 等待分润处理完成
  const commissionRes = await api('GET', '/api/agent/commissions', null, agentToken);

  if (!commissionRes.ok) {
    fail('7', `查询佣金失败: ${commissionRes.data.error}`);
  }
  log('7', '佣金确认', {
    stats: commissionRes.data.stats,
    records: commissionRes.data.records?.length + ' 条',
  });

  // ===== 步骤 8：代理商申请结算 =====
  log('8', '代理商申请结算');
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  const settleRes = await api('POST', '/api/agent/settlements', {
    action: 'apply',
    period,
  }, agentToken);

  if (!settleRes.ok) {
    fail('8', `结算申请失败: ${settleRes.data.error}`);
  }
  log('8', '结算申请成功', {
    settlementId: settleRes.data.settlementId,
    amount: settleRes.data.amount,
    count: settleRes.data.count,
  });

  // ===== 步骤 9：管理员登录 =====
  log('9', '管理员登录');
  const adminLoginRes = await api('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (!adminLoginRes.ok) {
    console.warn(`\n⚠️ [9] 管理员登录失败: ${adminLoginRes.data.error}（跳过管理员审核步骤）`);
  } else {
    const adminToken = extractToken(adminLoginRes);
    log('9', '管理员登录成功', { role: adminLoginRes.data.user?.role });

    // ===== 步骤 10：管理员审核结算 =====
    log('10', '管理员审批结算');
    const approveRes = await api('POST', '/api/admin/settlements', {
      action: 'approve',
      settlementId: settleRes.data.settlementId,
      remark: 'Mock 测试审批通过',
    }, adminToken);

    if (!approveRes.ok) {
      console.warn(`\n⚠️ [10] 结算审批失败: ${approveRes.data.error}`);
    } else {
      log('10', '结算审批通过');
    }

    // ===== 步骤 11：管理员标记已打款 =====
    log('11', '管理员标记已打款');
    const paidRes = await api('POST', '/api/admin/settlements', {
      action: 'mark-paid',
      settlementId: settleRes.data.settlementId,
      paidMethod: 'bank_transfer',
      paidAccount: '6222 **** **** 1234',
    }, adminToken);

    if (!paidRes.ok) {
      console.warn(`\n⚠️ [11] 标记打款失败: ${paidRes.data.error}`);
    } else {
      log('11', '已标记打款');
    }
  }

  // ===== 总结 =====
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║              测试结果汇总                      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`代理商邮箱:   ${AGENT_EMAIL}`);
  console.log(`代理商 ID:    ${agent.id}`);
  console.log(`邀请码:       ${agent.referralCode}`);
  console.log(`客户邮箱:     ${USER_EMAIL}`);
  console.log(`充值金额:     ¥${rechargeRes.data.amount}`);
  console.log(`预期佣金:     ¥${(rechargeRes.data.amount * 0.3).toFixed(2)}（30%）`);
  console.log(`结算申请ID:   ${settleRes.data.settlementId}`);
  console.log(`结算金额:     ¥${settleRes.data.amount?.toFixed(2)}`);
  console.log('\n✅ 全流程测试完成！可登录后台验证数据。');
  console.log(`   代理商后台: ${BASE_URL}/agent`);
  console.log(`   管理后台:   ${BASE_URL}/admin`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

main().catch(err => {
  console.error('\n💥 脚本执行出错:', err);
  process.exit(1);
});
