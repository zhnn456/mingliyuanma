/**
 * 知微阁平台 — 安全渗透测试脚本
 * 凭据均从环境变量读取，源码中不写入任何可用的凭据字面量。
 *
 * 必须设置的环境变量：
 *   TARGET           测试目标地址，如 http://localhost:3001
 *   ADMIN_EMAIL      管理员邮箱
 *   ADMIN_PASSWORD   管理员密码
 *   NORMAL_EMAIL     普通用户邮箱
 *   NORMAL_PASSWORD  普通用户密码
 *   FALLBACK_SECRET  Token 伪造测试用的 fallback 密钥
 *
 * 运行方式：
 *   TARGET=http://localhost:3001 node tests/security-test.js
 */
const TARGET           = process.env.TARGET           || 'http://localhost:3001';
const ADMIN_EMAIL      = process.env.ADMIN_EMAIL      || '';
const ADMIN_PASSWORD   = process.env.ADMIN_PASSWORD   || '';
const NORMAL_EMAIL     = process.env.NORMAL_EMAIL     || '';
const NORMAL_PASSWORD  = process.env.NORMAL_PASSWORD  || '';
const FALLBACK_SECRET  = process.env.FALLBACK_SECRET  || '';

const https = require('https');
const http  = require('http');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

function b64urlEncode(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signToken(payload, secret) {
  const encoded = b64urlEncode(JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 86400000,
  }));
  const sig = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('hex');
  return `${encoded}.${sig}`;
}

function req(method, pathStr, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const isHttps = TARGET.startsWith('https');
    const mod = isHttps ? https : http;
    const url = new URL(TARGET + pathStr);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 3001),
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
      timeout: 10000,
    };
    const r = mod.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c.toString());
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, body: data, headers: res.headers }); }
      });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function loginAs(email, password) {
  try {
    const r = await req('POST', '/api/auth/login', { email, password });
    const cookie = r.headers['set-cookie']?.[0] || '';
    const m = cookie.match(/token=([^;]+)/);
    if (m) return m[1];
    return null;
  } catch { return null; }
}

function authHeader(token) {
  return { 'Cookie': `token=${token}` };
}

const results = [];
function report(id, name, risk, passed, detail) {
  results.push({ id, name, risk, passed, detail });
  const icon = passed ? '✅' : '🔴';
  console.log(`  ${icon} [${risk}] ${id}: ${name}`);
  if (!passed) console.log(`       → ${detail}`);
}

(async () => {
  console.log('='.repeat(60));
  console.log('  知微阁平台 — 安全渗透测试');
  console.log(`  目标: ${TARGET}`);
  console.log('='.repeat(60));

  if (!FALLBACK_SECRET) console.log('\n⚠️  未设置 FALLBACK_SECRET，Token 伪造测试将跳过');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) console.log('\n⚠️  未设置 ADMIN_EMAIL / ADMIN_PASSWORD，认证相关测试将跳过');
  if (!NORMAL_EMAIL || !NORMAL_PASSWORD) console.log('\n⚠️  未设置 NORMAL_EMAIL / NORMAL_PASSWORD，越权测试将部分跳过');

  let adminToken = null, normalToken = null;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    console.log('\n[0] 登录（管理员）...');
    adminToken = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log(adminToken ? '  ✓ admin token 获取成功' : '  ✗ admin 登录失败，部分测试将跳过');
  }
  if (NORMAL_EMAIL && NORMAL_PASSWORD) {
    console.log('\n[0] 登录（普通用户）...');
    normalToken = await loginAs(NORMAL_EMAIL, NORMAL_PASSWORD);
    console.log(normalToken ? '  ✓ normal token 获取成功' : '  ✗ normal 登录失败，部分测试将跳过');
  }

  // 1. Token 伪造（FALLBACK_SECRET）
  console.log('\n[1] Token 伪造测试');
  if (FALLBACK_SECRET) {
    const forged = signToken(
      { sub: 'admin', email: 'evil@attacker.com', name: 'Hacker', role: 'admin', memberLevel: 'free' },
      FALLBACK_SECRET
    );
    const r1 = await req('GET', '/api/admin/users?page=1', null, authHeader(forged));
    report(
      'VULN-01-FORGE',
      'FALLBACK_SECRET 伪造 Admin Token 可越权访问',
      '极高危',
      r1.status === 401 || r1.status === 403,
      r1.status === 200
        ? `伪造成功，返回 ${r1.body?.users?.length ?? '?'} 条用户数据`
        : `正确拦截，返回 ${r1.status}（NEXTAUTH_SECRET 已覆盖 fallback）`
    );
  } else { console.log('  ⏭  跳过（FALLBACK_SECRET 未设置）'); }

  // 2. Cookie 安全标志
  console.log('\n[2] Cookie 安全标志');
  if (adminToken) {
    const r2 = await req('GET', '/api/auth/me', null, authHeader(adminToken));
    const cookieHeader = r2.headers['set-cookie']?.[0] || '';
    const hasHttpOnly = /;?\s*HttpOnly/.test(cookieHeader);
    const hasSecure   = /;?\s*Secure/.test(cookieHeader);
    report(
      'VULN-02-COOKIE',
      'Cookie 缺少 HttpOnly 标志（存在 XSS 窃取 token 风险）',
      '高危',
      hasHttpOnly && hasSecure,
      `${!hasHttpOnly ? '缺少HttpOnly ' : ''}${!hasSecure ? '缺少Secure' : ''}`
    );
  }

  // 3. x-agent-id 伪造越权
  console.log('\n[3] x-agent-id 伪造越权测试');
  if (adminToken) {
    const r3a = await req('GET', '/api/admin/users?page=1', null, {
      ...authHeader(adminToken),
      'x-agent-id': 'agt_forged_agent_00000',
    });
    report(
      'VULN-03-X-AGENT',
      '伪造 x-agent-id 绕过数据隔离，访问其他代理商用户',
      '高危',
      r3a.status === 403,
      r3a.status === 200
        ? `隔离失效，返回 ${r3a.body?.users?.length ?? 0} 条用户（含非本代理商数据）`
        : `返回 ${r3a.status}，隔离有效`
    );

    const r3b = await req('GET', '/api/admin/orders?page=1', null, {
      ...authHeader(adminToken),
      'x-agent-id': 'agt_other_agent_xyz',
    });
    report(
      'VULN-03B-ORDERS',
      '伪造 x-agent-id 查看其他代理商订单',
      '高危',
      r3b.status === 403 || (r3b.status === 200 && (!r3b.body?.orders || r3b.body.orders.length === 0)),
      r3b.status === 200
        ? `返回 ${r3b.body?.orders?.length ?? 0} 条订单（需人工确认是否属于伪造代理商）`
        : `返回 ${r3b.status}`
    );
  }

  // 4. 用户画像接口数据隔离
  console.log('\n[4] 用户画像接口数据隔离');
  if (adminToken) {
    const r4 = await req('GET', '/api/admin/user-profiles?id=admin', null, authHeader(adminToken));
    const hasPhone = !!(r4.body?.profile?.phone);
    report(
      'VULN-04-PROFILE',
      'user-profiles 接口返回手机号等敏感 PII',
      '高危',
      !hasPhone,
      hasPhone ? `泄露手机号: ${r4.body.profile.phone}` : '未返回手机号'
    );

    if (normalToken) {
      const r4b = await req('GET', '/api/admin/user-profiles?id=admin', null, authHeader(normalToken));
      report(
        'VULN-04B-NORMAL',
        '普通用户访问管理员接口（应返回 403）',
        '高危',
        r4b.status === 403,
        r4b.status !== 403 ? `权限校验失效，返回 ${r4b.status}` : '正确拦截'
      );
    }
  }

  // 5. 登录无速率限制（暴力破解）
  console.log('\n[5] 登录接口速率限制');
  if (ADMIN_EMAIL) {
    let rateLimited = false;
    for (let i = 0; i < 120; i++) {
      const r = await req('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: `wrong_pass_${i}_xxx` });
      if (r.status === 429) { rateLimited = true; break; }
    }
    report(
      'VULN-05-LOGIN-RATELIMIT',
      '登录接口无速率限制，可暴力破解（无 429 响应）',
      '高危',
      rateLimited,
      rateLimited ? '触发限流（有防护）' : '连续 120 次请求全部返回 401，未触发 429'
    );
  }

  // 6. 管理员接口无独立速率限制
  console.log('\n[6] 管理员接口速率限制');
  if (adminToken) {
    let rateLimited = false;
    for (let i = 0; i < 150; i++) {
      const r = await req('GET', '/api/admin/stats', null, authHeader(adminToken));
      if (r.status === 429) { rateLimited = true; break; }
    }
    report(
      'VULN-06-ADMIN-RATELIMIT',
      '管理员接口无独立速率限制，可无限刷取数据',
      '中危',
      rateLimited,
      rateLimited ? '触发限流' : '连续 150 次请求全部成功，无任何限流'
    );
  }

  // 7. 命令注入试探（rollback 接口 - 应已修复）
  console.log('\n[7] 命令注入试探（rollback 接口）');
  if (adminToken && FALLBACK_SECRET) {
    const r7 = await req('POST', '/api/admin/rollback', {
      backupPath: '/www/ming8-backup-123; id; echo PWNED'
    }, authHeader(adminToken));
    report(
      'VULN-07-CMD-INJECT',
      'Rollback 接口命令注入风险（应已修复）',
      '高危',
      r7.status === 400 || r7.status === 500,
      r7.body?.success === true
        ? '⚠️ 恶意路径被接受，存在命令注入风险'
        : r7.status === 400
          ? '✅ 路径校验生效，返回 400（修复已生效）'
          : `返回 ${r7.status}: ${JSON.stringify(r7.body)?.slice(0, 200)}`
    );
  }

  // 8. 未认证访问管理接口
  console.log('\n[8] 未认证访问管理接口');
  const unauthPaths = [
    '/api/admin/users?page=1',
    '/api/admin/config',
    '/api/admin/finance',
    '/api/admin/refunds',
    '/api/admin/card-keys',
  ];
  for (const p of unauthPaths) {
    try {
      const r = await req('GET', p);
      const sid = p.replace(/\//g, '-');
      report(
        `VULN-08-UNAUTH${sid}`,
        `未认证访问 ${p}`,
        '高危',
        r.status === 401 || r.status === 403,
        r.status === 200
          ? `数据泄露: ${JSON.stringify(r.body)?.slice(0, 80)}`
          : `正确返回 ${r.status}`
      );
    } catch (e) {
      console.log(`  ⚠️  ${p} 连接失败（服务未运行）: ${(e).message}`);
    }
  }

  // 9. 敏感字段泄露
  console.log('\n[9] 敏感字段泄露测试');
  if (adminToken) {
    const r9 = await req('GET', '/api/admin/users?page=1&pageSize=3', null, authHeader(adminToken));
    const u = r9.body?.users?.[0] || {};
    report(
      'VULN-09-PHONE-LEAK',
      '用户列表接口返回明文手机号（应已脱敏）',
      '中危',
      !u.phone || u.phone.includes('***'),
      u.phone ? `手机号: ${u.phone}` : '已脱敏'
    );
    report(
      'VULN-09B-PASSHASH',
      '用户列表返回密码哈希（应已过滤）',
      '极高危',
      !u.passwordHash,
      u.passwordHash ? '密码哈希泄露！' : '已过滤 passwordHash'
    );
  }

  // 10. 注册无验证码
  console.log('\n[10] 注册接口测试（无验证码/无图形验证）');
  try {
    const r10 = await req('POST', '/api/user/register', {
      email: `sec_test_${Date.now()}@example.com`,
      password: process.env.TEST_REGISTER_PASSWORD || '',
      name: 'SecurityTest',
    });
    report(
      'VULN-10-REGISTER',
      '注册接口无验证码，可批量注册（撞库/刷号）',
      '中危',
      r10.status !== 200,
      r10.status === 200
        ? '注册成功，无任何验证码保护'
        : `返回 ${r10.status}: ${r10.body?.error || ''}`
    );
  } catch (e) { console.log('  ⚠️  注册接口连接失败（服务未运行）'); }

  // 11. 注入测试
  console.log('\n[11] 注入测试（SQL/XSS）');
  try {
    const injections = [
      { email: "'; DROP TABLE User;--", password: process.env.TEST_LOGIN_PASS || '', desc: '邮箱SQL注入' },
      { email: ADMIN_EMAIL || 'x@x.com', password: "' OR '1'='1", desc: '密码SQL注入' },
      { email: ADMIN_EMAIL || 'x@x.com', password: '<script>alert(1)</script>', desc: '密码XSS' },
      { email: ADMIN_EMAIL || 'x@x.com', password: 'a'.repeat(5000), desc: '超长密码' },
    ];
    for (const t of injections) {
      const r = await req('POST', '/api/auth/login', { email: t.email, password: t.password });
      const hadError = r.status === 500 || String(r.body?.error || '').includes('数据库');
      report(
        `VULN-11-INJECT-${t.desc}`,
        t.desc,
        '中危',
        !hadError,
        hadError
          ? `返回500/数据库错误，可能泄露结构: ${r.body?.error}`
          : `正常返回 ${r.status}`
      );
    }
  } catch (e) { console.log('  ⚠️  注入测试连接失败（服务未运行）'); }

  // 12. PRIMARY_ADMIN_IDS 硬编码（信息性）
  console.log('\n[12] 源码硬编码敏感值');
  report(
    'VULN-12-HARDCODED',
    'PRIMARY_ADMIN_IDS 硬编码在源码（可被枚举）',
    '低危',
    false,
    '源码中 PRIMARY_ADMIN_IDS = [admin, cm1admin001]，攻击者可直接枚举管理员ID，绕过数据隔离'
  );

  // 汇总
  console.log('\n' + '='.repeat(60));
  console.log('  测试汇总');
  console.log('='.repeat(60));
  const total    = results.length;
  const passed   = results.filter(r => r.passed).length;
  const failed   = total - passed;
  const critical = results.filter(r => r.risk === '极高危' && !r.passed).length;
  const high     = results.filter(r => r.risk === '高危'   && !r.passed).length;
  const medium   = results.filter(r => r.risk === '中危'   && !r.passed).length;
  const low      = results.filter(r => r.risk === '低危'   && !r.passed).length;

  console.log(`\n总计: ${total} 项  |  通过: ${passed}  |  发现问题: ${failed}`);
  console.log(`  🔴 极高危: ${critical}`);
  console.log(`  🟠 高危:   ${high}`);
  console.log(`  🟡 中危:   ${medium}`);
  console.log(`  🔵 低危:   ${low}`);

  console.log('\n详细结果:');
  for (const r of results) {
    const icon = r.passed ? '✅' : '🔴';
    console.log(`  ${icon} [${r.risk}] ${r.id}: ${r.name}`);
    if (!r.passed) console.log(`       → ${r.detail}`);
  }

  const resultFile = path.join(__dirname, 'security-test-results.json');
  fs.writeFileSync(resultFile, JSON.stringify({
    target: TARGET,
    timestamp: new Date().toISOString(),
    total, passed, failed, critical, high, medium, low,
    items: results,
  }, null, 2));
  console.log(`\n完整结果已写入: ${resultFile}`);

  process.exit(failed > 0 ? 1 : 0);
})();
