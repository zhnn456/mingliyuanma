/**
 * 知微阁平台 — 洪水抗性与爬虫防护实测脚本
 *
 * 环境变量：
 *   TARGET  目标地址，默认 https://bazi6.cc.cd
 *
 * 运行方式：
 *   node tests/flood-crawler-test.js
 *
 * 注意：总请求量约 250 次、并发峰值 30，用于探测防护是否存在，
 *       不做持续性压测以免影响线上业务。
 */
const TARGET = process.env.TARGET || 'https://bazi6.cc.cd';
const https = require('https');
const http = require('http');

function req(method, pathStr, body, extraHeaders) {
  return new Promise((resolve) => {
    const started = Date.now();
    const isHttps = TARGET.startsWith('https');
    const mod = isHttps ? https : http;
    let url;
    try { url = new URL(TARGET + pathStr); } catch { return resolve({ status: -1, ms: 0, body: '', headers: {} }); }
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: Object.assign({ 'Content-Type': 'application/json' }, extraHeaders || {}),
      timeout: 15000,
    };
    const r = mod.request(options, (res) => {
      let data = '';
      res.on('data', c => { if (data.length < 50000) data += c.toString(); });
      res.on('end', () => resolve({ status: res.statusCode, ms: Date.now() - started, body: data, headers: res.headers }));
    });
    r.on('error', e => resolve({ status: -1, ms: Date.now() - started, body: String(e.message), headers: {} }));
    r.on('timeout', () => { r.destroy(); resolve({ status: -2, ms: Date.now() - started, body: 'timeout', headers: {} }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function wave(name, concurrency, total, fn) {
  const results = [];
  let launched = 0;
  for (let batchStart = 0; batchStart < total; batchStart += concurrency) {
    const batch = [];
    for (let i = 0; i < concurrency && launched < total; i++, launched++) batch.push(fn(launched));
    const rs = await Promise.all(batch);
    results.push(...rs);
    await new Promise(r => setTimeout(r, 300));
  }
  const statuses = {};
  for (const r of results) statuses[r.status] = (statuses[r.status] || 0) + 1;
  const okLat = results.filter(r => r.status >= 200 && r.status < 500).map(r => r.ms).sort((a, b) => a - b);
  const stats = {
    statuses,
    p50: percentile(okLat, 50),
    p95: percentile(okLat, 95),
    max: okLat.length ? okLat[okLat.length - 1] : 0,
    errors: results.filter(r => r.status < 0).length,
  };
  console.log(`\n[${name}] ${total} 请求 / 并发${concurrency}`);
  console.log(`   状态码分布: ${JSON.stringify(statuses)}`);
  console.log(`   延迟 p50=${stats.p50}ms  p95=${stats.p95}ms  max=${stats.max}ms  网络错误=${stats.errors}`);
  return { name, ...stats };
}

(async () => {
  console.log('='.repeat(62));
  console.log('  知微阁平台 — 洪水抗性 & 爬虫防护实测');
  console.log(`  目标: ${TARGET}`);
  console.log('='.repeat(62));
  const flood = [];
  const crawler = [];

  // ===== Part A: 陌生 IP 爆炸式请求 =====
  console.log('\n========== PART A: 高并发洪水测试 ==========');

  flood.push(await wave('A1 首页洪水', 30, 60, () => req('GET', '/', null, { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })));

  flood.push(await wave('A2 登录接口爆破洪水', 20, 40, i => req('POST', '/api/auth/login', { email: `flood_${Date.now()}_${i}@attacker.com`, password: 'BruteForce!123' })));

  flood.push(await wave('A3 公开广场接口洪水(重DB查询)', 20, 40, () => req('GET', '/api/offering/square')));

  const regResults = await wave('A4 批量注册洪水', 6, 6, i => req('POST', '/api/user/register', { email: `flood_reg_${Date.now()}_${i}@attacker.com`, password: '', name: 'FloodBot' }));
  flood.push(regResults);
  const regOk = regResults.statuses['200'] || 0;
  console.log(`   → 其中 ${regOk} 个空密码账号注册成功`);

  flood.push(await wave('B5 管理员接口匿名洪水', 15, 30, () => req('GET', '/api/admin/stats')));

  const anyLimited = flood.some(f => (f.statuses['429'] || 0) > 0 || (f.statuses['503'] || 0) > 0);

  // ===== Part B: 恶意爬虫模拟 =====
  console.log('\n========== PART B: 恶意爬虫模拟 ==========');

  // B1 robots.txt
  const robots = await req('GET', '/robots.txt');
  console.log(`\n[B1] robots.txt → HTTP ${robots.status}${robots.status === 200 ? '（内容前120字符: ' + robots.body.slice(0, 120).replace(/\n/g, ' | ') + '）' : '（不存在，搜索引擎与恶意爬虫均无 Disallow 引导）'}`);

  // B2 sitemap.xml
  const sitemap = await req('GET', '/sitemap.xml');
  console.log(`[B2] sitemap.xml → HTTP ${sitemap.status} (${sitemap.body.length} 字节)`);

  // B3 UA 变体封锁检测
  console.log('\n[B3] User-Agent 封锁检测（GET /）');
  const uas = [
    ['正常浏览器', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0'],
    ['Googlebot伪装', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
    ['Baiduspider伪装', 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)'],
    ['python-requests', 'python-requests/2.31.0'],
    ['curl', 'curl/8.0.1'],
    ['sqlmap', 'sqlmap/1.8#stable (https://sqlmap.org)'],
    ['空UA', ''],
  ];
  let uaBlocked = false;
  for (const [label, ua] of uas) {
    const r = await req('GET', '/', null, ua ? { 'User-Agent': ua } : {});
    const blocked = r.status === 403 || r.status === 406 || r.status === 429 || r.status === 444;
    if (blocked) uaBlocked = true;
    console.log(`   ${blocked ? '🛑 已拦截' : '✅ 未拦截'} [${r.status}] ${label}${label === '空UA' ? '（无UA头）' : ''}`);
  }

  // B4 敏感路径探测
  console.log('\n[B4] 敏感路径/文件枚举（爬虫目录爆破手法）');
  const probePaths = [
    '/.env', '/.env.local', '/.env.production', '/.git/config', '/.git/HEAD',
    '/backup.sql', '/db.sql', '/database.sql', '/dump.sql', '/ming8_db.sql',
    '/server.js', '/package.json', '/ecosystem.config.js', '/docker-compose.yml',
    '/wp-admin/', '/phpmyadmin/', '/admin.php', '/.DS_Store', '/web.config', '/.svn/entries',
  ];
  let leakedPaths = [];
  for (const p of probePaths) {
    const r = await req('GET', p);
    if (r.status === 200 && !/<html/i.test(r.body.slice(0, 500))) leakedPaths.push(`${p} (${r.body.length}B)`);
    console.log(`   ${r.status === 200 ? '🔴' : '✅'} [${r.status}] ${p}`);
  }

  // B5 /admin 后台入口对爬虫暴露度
  const adminPage = await req('GET', '/admin');
  console.log(`\n[B5] /admin 后台页面 → HTTP ${adminPage.status}${adminPage.status >= 300 && adminPage.status < 400 ? ` 重定向至 ${adminPage.headers.location || '?'}` : ''}`);

  // B6 安全响应头检查
  console.log('\n[B6] 安全响应头检查（GET /）');
  const home = await req('GET', '/', null, { 'User-Agent': 'Mozilla/5.0' });
  const headerChecks = [
    ['Strict-Transport-Security', 'HSTS 强制HTTPS'],
    ['X-Frame-Options', '防点击劫持'],
    ['X-Content-Type-Options', '防MIME嗅探'],
    ['Content-Security-Policy', 'CSP 内容安全策略'],
    ['Server', '服务器版本披露'],
    ['X-Powered-By', '框架版本披露'],
  ];
  for (const [h, desc] of headerChecks) {
    const v = home.headers[h.toLowerCase()];
    const sensitive = h === 'Server' || h === 'X-Powered-By';
    const bad = sensitive ? !!v : !v;
    console.log(`   ${bad ? (sensitive ? '⚠️ ' : '🔴') : '✅'} ${h}: ${v ? String(v).slice(0, 60) : '缺失'}（${desc}${sensitive ? '' : bad ? ' 缺失' : ''}）`);
  }

  // ===== 汇总 =====
  console.log('\n' + '='.repeat(62));
  console.log('  结论摘要');
  console.log('='.repeat(62));
  console.log(`
【爆炸式请求抗性】
  ① 应用层限流: ${anyLimited ? '🟢 观察到 429/503，存在熔断' : '🔴 全部请求畅通，未见任何 429/503'}
  ② 批量注册: ${regOk > 0 ? `🔴 ${regOk}/6 个空密码账号直接注册成功` : '🟢 注册被拦'}
  ③ 匿名刷管理员接口: ${(flood[4].statuses['200'] || 0) > 0 ? '🔴 存在200响应' : '🟢 全部拒绝'}

【爬虫防护】
  ④ UA 封锁: ${uaBlocked ? '🟢 存在UA拦截' : '🔴 对 python-requests/curl/sqlmap/空UA 完全不设防'}
  ⑤ robots.txt: ${robots.status === 200 ? '🟡 已配置' : '🔴 不存在（/api、/admin 无 Disallow 引导）'}
  ⑥ 敏感路径泄露: ${leakedPaths.length ? '🔴 泄露: ' + leakedPaths.join(', ') : '🟢 常见敏感路径全部404'}
  ⑦ CSP 头: ${home.headers['content-security-policy'] ? '🟢 已配置' : '🔴 缺失（XSS 最后防线缺一环）'}
`);
})();
