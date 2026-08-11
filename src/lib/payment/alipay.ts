/**
 * 支付宝支付工具类
 * 基于 Web Crypto API（纯 JS 实现）
 *
 * 使用前需配置：
 *   环境变量 ALIPAY_APP_ID
 *   环境变量 ALIPAY_PRIVATE_KEY  (商户RSA私钥 PEM)
 *   环境变量 ALIPAY_PUBLIC_KEY   (支付宝RSA公钥 PEM)
 *   环境变量 ALIPAY_NOTIFY_URL   (回调通知地址)
 *   环境变量 ALIPAY_GATEWAY      (网关地址，默认正式环境)
 */

// ============ 类型定义 ============

export interface AlipayConfig {
  appId: string;
  privateKey: string;     // PEM 格式商户私钥
  publicKey: string;      // PEM 格式支付宝公钥
  notifyUrl: string;      // 异步回调地址
  returnUrl?: string;     // 同步跳转地址
  gateway: string;        // 网关地址
  sandbox?: boolean;       // 是否沙箱环境
}

export interface AlipayOrderParams {
  orderNo: string;
  amount: number;          // 金额（元）
  title: string;
  description?: string;
  returnUrl?: string;
}

export interface AlipayCallbackData {
  orderNo: string;
  transactionId: string;
  amount: number;
  status: 'TRADE_SUCCESS' | 'TRADE_FINISHED' | 'WAIT_BUYER_PAY' | 'TRADE_CLOSED';
}

// ============ 工具函数 ============

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * RSA2 签名（SHA256withRSA）
 */
async function rsaSign(privateKeyPem: string, data: string): Promise<string> {
  const keyData = pemToArrayBuffer(privateKeyPem);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const dataBuf = new TextEncoder().encode(data);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, dataBuf);
  return arrayBufferToBase64(signature);
}

/**
 * RSA2 验签
 */
async function rsaVerify(publicKeyPem: string, data: string, signBase64: string): Promise<boolean> {
  try {
    const keyData = pemToArrayBuffer(publicKeyPem);
    const key = await crypto.subtle.importKey(
      'spki',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const dataBuf = new TextEncoder().encode(data);
    const signBuf = base64ToArrayBuffer(signBase64);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signBuf, dataBuf);
  } catch (e) {
    console.error('[支付宝] 验签失败:', e);
    return false;
  }
}

/**
 * 把参数按 key 的字典序排列并拼接成查询字符串
 */
function buildSortedQueryString(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .filter(k => params[k] !== '' && params[k] !== undefined)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return sorted;
}

/**
 * URL 编码（支付宝要求编码后签名）
 */
function encodeURIComponentPlus(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/%20/g, '+');
}

// ============ 支付宝核心 API ============

/**
 * 异步构造签名后的完整 URL — 电脑网站支付
 */
export async function createPagePayUrlAsync(
  config: AlipayConfig,
  params: AlipayOrderParams
): Promise<string> {
  const bizContent = JSON.stringify({
    out_trade_no: params.orderNo,
    total_amount: params.amount.toFixed(2),
    subject: params.title,
    body: params.description || params.title,
    product_code: 'FAST_INSTANT_TRADE_PAY',
    timeout_express: '30m',
  });

  const requestParams: Record<string, string> = {
    app_id: config.appId,
    method: 'alipay.trade.page.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: formatTimestamp(new Date()),
    version: '1.0',
    notify_url: config.notifyUrl,
    biz_content: bizContent,
  };

  if (params.returnUrl || config.returnUrl) {
    requestParams.return_url = params.returnUrl || config.returnUrl!;
  }

  // 签名
  const signString = buildSortedQueryString(requestParams);
  const sign = await rsaSign(config.privateKey, signString);

  // 拼接最终 URL
  const encodedParams = Object.entries({ ...requestParams, sign })
    .map(([k, v]) => `${k}=${encodeURIComponentPlus(v)}`)
    .join('&');

  return `${config.gateway}?${encodedParams}`;
}

/**
 * 异步构造 WAP 支付 URL
 */
export async function createWapPayUrlAsync(
  config: AlipayConfig,
  params: AlipayOrderParams
): Promise<string> {
  const bizContent = JSON.stringify({
    out_trade_no: params.orderNo,
    total_amount: params.amount.toFixed(2),
    subject: params.title,
    body: params.description || params.title,
    product_code: 'QUICK_WAP_WAY',
    timeout_express: '30m',
  });

  const requestParams: Record<string, string> = {
    app_id: config.appId,
    method: 'alipay.trade.wap.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: formatTimestamp(new Date()),
    version: '1.0',
    notify_url: config.notifyUrl,
    biz_content: bizContent,
  };

  if (params.returnUrl || config.returnUrl) {
    requestParams.return_url = params.returnUrl || config.returnUrl!;
  }

  const signString = buildSortedQueryString(requestParams);
  const sign = await rsaSign(config.privateKey, signString);

  const encodedParams = Object.entries({ ...requestParams, sign })
    .map(([k, v]) => `${k}=${encodeURIComponentPlus(v)}`)
    .join('&');

  return `${config.gateway}?${encodedParams}`;
}

/**
 * 查询交易状态
 */
export async function queryTrade(
  config: AlipayConfig,
  orderNo: string
): Promise<{ status: string; transactionId: string; amount: number }> {
  const bizContent = JSON.stringify({ out_trade_no: orderNo });

  const requestParams: Record<string, string> = {
    app_id: config.appId,
    method: 'alipay.trade.query',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: formatTimestamp(new Date()),
    version: '1.0',
    biz_content: bizContent,
  };

  const signString = buildSortedQueryString(requestParams);
  const sign = await rsaSign(config.privateKey, signString);

  const formData = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...requestParams, sign })) {
    formData.append(k, v);
  }

  const response = await fetch(config.gateway, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  const data = JSON.parse(await response.text());
  const resp = data.alipay_trade_query_response;

  if (resp.code !== '10000') {
    throw new Error(`查询失败: ${resp.sub_msg || resp.msg}`);
  }

  return {
    status: resp.trade_status || 'WAIT_BUYER_PAY',
    transactionId: resp.trade_no || '',
    amount: parseFloat(resp.total_amount || '0'),
  };
}

/**
 * 申请退款
 */
export async function createRefund(
  config: AlipayConfig,
  params: {
    orderNo: string;
    refundNo: string;
    amount: number;
    refundAmount: number;
    reason?: string;
  }
): Promise<{ refundId: string; status: string }> {
  const bizContent = JSON.stringify({
    out_trade_no: params.orderNo,
    out_request_no: params.refundNo,
    refund_amount: params.refundAmount.toFixed(2),
    refund_reason: params.reason || '用户申请退款',
  });

  const requestParams: Record<string, string> = {
    app_id: config.appId,
    method: 'alipay.trade.refund',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: formatTimestamp(new Date()),
    version: '1.0',
    biz_content: bizContent,
  };

  const signString = buildSortedQueryString(requestParams);
  const sign = await rsaSign(config.privateKey, signString);

  const formData = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...requestParams, sign })) {
    formData.append(k, v);
  }

  const response = await fetch(config.gateway, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  const data = JSON.parse(await response.text());
  const resp = data.alipay_trade_refund_response;

  if (resp.code !== '10000') {
    throw new Error(`退款失败: ${resp.sub_msg || resp.msg}`);
  }

  return {
    refundId: resp.trade_no || '',
    status: resp.fund_change === 'Y' ? 'SUCCESS' : 'FAILED',
  };
}

/**
 * 验证回调签名
 */
export async function verifyCallback(
  config: AlipayConfig,
  params: Record<string, string>
): Promise<boolean> {
  const sign = params.sign;
  if (!sign) return false;

  // 移除 sign 和 sign_type，构造待签名字符串
  const { sign: _, sign_type: __, ...restParams } = params;
  const signString = buildSortedQueryString(restParams);

  return await rsaVerify(config.publicKey, signString, sign);
}

/**
 * 解析回调数据
 */
export async function parseCallback(
  config: AlipayConfig,
  params: Record<string, string>
): Promise<AlipayCallbackData> {
  const isValid = await verifyCallback(config, params);
  if (!isValid) {
    throw new Error('回调签名验证失败');
  }

  const amount = parseFloat(params.total_amount || '0');
  const statusMap: Record<string, AlipayCallbackData['status']> = {
    'TRADE_SUCCESS': 'TRADE_SUCCESS',
    'TRADE_FINISHED': 'TRADE_FINISHED',
    'WAIT_BUYER_PAY': 'WAIT_BUYER_PAY',
    'TRADE_CLOSED': 'TRADE_CLOSED',
  };

  return {
    orderNo: params.out_trade_no || '',
    transactionId: params.trade_no || '',
    amount: isNaN(amount) ? 0 : amount,
    status: statusMap[params.trade_status] || 'TRADE_CLOSED',
  };
}

// ============ 辅助函数 ============

function formatTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${mi}:${s}`;
}
