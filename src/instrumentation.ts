/**
 * Next.js instrumentation hook
 * 在 Node.js server 启动时执行（早于 middleware 和第一个请求）
 *
 * 授权验证闭环设计：
 * 1. 中央平台（无 APP_LICENSE_KEY）：跳过验证，直接启动
 * 2. 源码站点（有 APP_LICENSE_KEY）：启动时立即验证，失败则设置全局锁定标志
 * 3. middleware 运行时每 10 分钟复验，可被中央远程吊销
 *
 * 注意：启动验证不阻塞 server 启动（异步执行），避免网络问题导致服务不可用
 *      但验证失败后 middleware 会立即锁定所有功能
 *
 * 全局状态共享：通过 globalThis.__licenseValid 与 middleware 共享状态
 */

// 全局状态声明（与 middleware.ts 共享）
declare global {
  // eslint-disable-next-line no-var
  var __licenseValid: boolean | undefined;
  // eslint-disable-next-line no-var
  var __licenseCheckTime: number | undefined;
  // eslint-disable-next-line no-var
  var __licenseFailCount: number | undefined;
}

export async function register() {
  // 只在 Node.js runtime 执行（不在 Edge runtime 执行）
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // 中央平台跳过验证（无 APP_LICENSE_KEY 或 IS_CENTER=true）
  const isCenter = process.env.IS_CENTER === 'true' || !process.env.APP_LICENSE_KEY;
  if (isCenter) {
    console.log('[License] 中央平台模式，跳过授权验证');
    // 中央平台默认授权有效
    globalThis.__licenseValid = true;
    return;
  }

  // 源码站点：启动时验证授权码
  const licenseKey = process.env.APP_LICENSE_KEY || '';
  const agentId = process.env.APP_AGENT_ID || '';
  const centerApi = process.env.CENTER_API || '';
  const domain = process.env.NEXTAUTH_URL || '';

  console.log('[License] 源码站点模式，启动授权验证...');
  console.log(`[License]   AgentID: ${agentId}`);
  console.log(`[License]   Domain:  ${domain}`);
  console.log(`[License]   Center:  ${centerApi}`);
  console.log(`[License]   Key:     ${licenseKey.slice(0, 20)}...`);

  if (!centerApi) {
    console.error('[License] ✗ 未配置 CENTER_API（中央平台地址），无法验证授权');
    console.error('[License]   进入宽限模式（等待 middleware 运行时验证）');
    return;
  }

  // 异步验证（不阻塞启动）
  verifyLicenseOnStartup(licenseKey, centerApi, domain).catch((err) => {
    console.error('[License] 启动验证异常:', err?.message || err);
  });

  // 启动心跳定时器（每5分钟向中央站报告状态）
  startHeartbeat(licenseKey, agentId, centerApi, domain);
}

/**
 * 心跳定时器
 * 每5分钟向中央站发送心跳，更新 Agent 表的 lastSyncAt
 * 这样中央站的健康看板就能显示源码站为"在线"
 */
function startHeartbeat(licenseKey: string, agentId: string, centerApi: string, domain: string) {
  const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5分钟

  const sendHeartbeat = async () => {
    try {
      const res = await fetch(`${centerApi}/api/agent/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license: licenseKey,
          domain,
          version: process.env.APP_VERSION || 'v4.0.0',
          agentId,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          // 心跳成功，静默处理
          return;
        }
      }
      console.warn('[Heartbeat] 心跳上报失败:', res.status);
    } catch (err: any) {
      // 网络错误静默处理，不打扰日志
      if (err?.name !== 'TimeoutError' && err?.name !== 'AbortError') {
        console.warn('[Heartbeat] 异常:', err?.message || err);
      }
    }
  };

  // 启动后立即发送一次
  setTimeout(sendHeartbeat, 30_000); // 30秒后首次发送

  // 定时发送
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  console.log(`[Heartbeat] 心跳定时器已启动（每${HEARTBEAT_INTERVAL / 60000}分钟）`);
}

/**
 * 启动时验证授权码
 * 验证结果通过 globalThis.__licenseValid 同步到 middleware
 */
async function verifyLicenseOnStartup(licenseKey: string, centerApi: string, domain: string) {
  const params = new URLSearchParams({
    license: licenseKey,
    domain,
    version: process.env.APP_VERSION || 'v4.0.0',
  });

  try {
    const res = await fetch(`${centerApi}/api/license/verify?${params}`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000), // 10 秒超时
    });

    if (res.ok) {
      const data = await res.json();
      if (data.valid) {
        console.log('[License] ✓ 授权验证通过');
        console.log(`[License]   品牌: ${data.payload?.brandName || '-'}`);
        console.log(`[License]   等级: ${data.payload?.level || '-'}`);
        console.log(`[License]   到期: ${data.payload?.expiryAt || '永久'}`);
        globalThis.__licenseValid = true;
        globalThis.__licenseCheckTime = Date.now();
        return;
      } else {
        console.error(`[License] ✗ 授权验证失败: ${data.reason || '未知原因'}`);
      }
    } else {
      const status = res.status;
      let reason = `HTTP ${status}`;
      try {
        const data = await res.json();
        reason = data.reason || reason;
      } catch {}
      console.error(`[License] ✗ 授权验证失败: ${reason}`);
    }
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      console.error('[License] ✗ 授权验证超时（10秒），进入宽限模式');
    } else {
      console.error(`[License] ✗ 无法连接中央平台: ${err?.message || err}`);
      console.error('[License]   进入宽限模式（24小时内可用缓存，超时后锁定）');
    }
    // 网络问题：不立即锁定，进入宽限模式（middleware 的 license-validator 已有此逻辑）
    return;
  }

  // 验证失败：设置全局锁定标志
  console.error('[License] ✗ 授权无效，middleware 将锁定所有功能');
  globalThis.__licenseValid = false;
}
