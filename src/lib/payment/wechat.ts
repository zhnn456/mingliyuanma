/**
 * 微信支付 V3 API 工具类
 * 基于 Web Crypto API（纯 JS 实现）
 *
 * 使用前需配置：
 *   环境变量 WECHAT_APP_ID
 *   环境变量 WECHAT_MCH_ID
 *   环境变量 WECHAT_API_V3_KEY
 *   环境变量 WECHAT_PRIVATE_KEY  (商户私钥 PEM)
 *   环境变量 WECHAT_CERT_SERIAL  (商户证书序列号)
 *   环境变量 WECHAT_NOTIFY_URL   (回调通知地址)
 */

// ============ 类型定义 ============

export interface WechatPayConfig {
  appId: string;
  mchId: string;
  apiV3Key: string;
  privateKey: string;       // PEM 格式私钥
  certSerial: string;       // 商户证书序列号
  notifyUrl: string;        // 回调地址
}

export interface WechatNativeOrderParams {
  orderNo: string;
  amount: number;          // 金额（元）
  description: string;
  notifyUrl?: string;
}

export interface WechatNativeOrderResult {
  codeUrl: string;          // 微信支付二维码链接
  orderId: string;          // 微信支付订单号
}

export interface WechatCallbackData {
  orderNo: string;
  transactionId: string;
  amount: number;          // 金额（分）
  status: 'SUCCESS' | 'FAILED' | 'REFUND';
}

// ============ 工具函数 ============

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
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
 * 生成随机字符串
 */
function generateNonce(): string {
  const buf = new Uint8Array(16);
  globalThis.crypto.getRandomValues(buf);
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 使用 Web Crypto API 进行 SHA256withRSA 签名
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
 * AES-GCM 解密（用于解密回调中的加密数据）
 */
async function decryptResource(apiV3Key: string, associatedData: string, nonce: string, ciphertext: string): Promise<string> {
  const keyData = new TextEncoder().encode(apiV3Key);
  const iv = new TextEncoder().encode(nonce);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const encrypted = base64ToArrayBuffer(ciphertext);
  const aad = new TextEncoder().encode(associatedData);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: aad },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

// ============ 微信支付 V3 核心 ============

const WECHAT_API_BASE = 'https://api.mch.weixin.qq.com';

/**
 * 构造授权头签名
 */
async function buildAuthHeader(
  config: WechatPayConfig,
  method: string,
  url: string,
  body: string
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  // 签名串：HTTP方法\n请求URL\n时间戳\n随机串\n请求体\n
  const signString = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = await rsaSign(config.privateKey, signString);

  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${config.certSerial}",signature="${signature}"`;
}

/**
 * Native 下单（扫码支付）
 * 文档: https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_4_1.shtml
 */
export async function createNativeOrder(
  config: WechatPayConfig,
  params: WechatNativeOrderParams
): Promise<WechatNativeOrderResult> {
  const apiUrl = '/v3/pay/transactions/native';
  const fullUrl = `${WECHAT_API_BASE}${apiUrl}`;

  const requestBody = JSON.stringify({
    appid: config.appId,
    mchid: config.mchId,
    description: params.description,
    out_trade_no: params.orderNo,
    time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    notify_url: params.notifyUrl || config.notifyUrl,
    amount: {
      total: Math.round(params.amount * 100), // 元转分
      currency: 'CNY',
    },
  });

  const authHeader = await buildAuthHeader(config, 'POST', apiUrl, requestBody);

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader,
    },
    body: requestBody,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[微信支付] 下单失败:', data);
    throw new Error(`微信支付下单失败: ${data.message || response.statusText}`);
  }

  return {
    codeUrl: data.code_url,
    orderId: data.id || '',
  };
}

/**
 * JSAPI 下单（微信内支付，需要 openid）
 */
export async function createJsapiOrder(
  config: WechatPayConfig,
  params: WechatNativeOrderParams & { openid: string }
): Promise<{ prepayId: string; timeStamp: string; nonceStr: string; package: string; signType: string; paySign: string }> {
  const apiUrl = '/v3/pay/transactions/jsapi';
  const fullUrl = `${WECHAT_API_BASE}${apiUrl}`;

  const requestBody = JSON.stringify({
    appid: config.appId,
    mchid: config.mchId,
    description: params.description,
    out_trade_no: params.orderNo,
    time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    notify_url: params.notifyUrl || config.notifyUrl,
    amount: {
      total: Math.round(params.amount * 100),
      currency: 'CNY',
    },
    payer: {
      openid: params.openid,
    },
  });

  const authHeader = await buildAuthHeader(config, 'POST', apiUrl, requestBody);

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader,
    },
    body: requestBody,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[微信支付] JSAPI下单失败:', data);
    throw new Error(`微信支付JSAPI下单失败: ${data.message || response.statusText}`);
  }

  // 生成前端调起支付的参数
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = generateNonce();
  const packageStr = `prepay_id=${data.prepay_id}`;

  // 签名
  const paySignString = `${config.appId}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`;
  const paySign = await rsaSign(config.privateKey, paySignString);

  return {
    prepayId: data.prepay_id,
    timeStamp,
    nonceStr,
    package: packageStr,
    signType: 'RSA',
    paySign,
  };
}

/**
 * 查询订单状态
 */
export async function queryOrder(
  config: WechatPayConfig,
  orderNo: string
): Promise<{ status: string; transactionId: string; amount: number }> {
  const apiUrl = `/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${config.mchId}`;
  const fullUrl = `${WECHAT_API_BASE}${apiUrl}`;

  const authHeader = await buildAuthHeader(config, 'GET', apiUrl, '');

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': authHeader,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[微信支付] 查询订单失败:', data);
    throw new Error(`查询订单失败: ${data.message || response.statusText}`);
  }

  return {
    status: data.trade_state || 'UNKNOWN',
    transactionId: data.transaction_id || '',
    amount: data.amount?.total ? data.amount.total / 100 : 0, // 分转元
  };
}

/**
 * 申请退款
 */
export async function createRefund(
  config: WechatPayConfig,
  params: {
    orderNo: string;
    refundNo: string;
    amount: number;        // 原金额（元）
    refundAmount: number;  // 退款金额（元）
    reason?: string;
  }
): Promise<{ refundId: string; status: string }> {
  const apiUrl = '/v3/refund/domestic/refunds';
  const fullUrl = `${WECHAT_API_BASE}${apiUrl}`;

  const requestBody = JSON.stringify({
    out_trade_no: params.orderNo,
    out_refund_no: params.refundNo,
    reason: params.reason || '用户申请退款',
    amount: {
      refund: Math.round(params.refundAmount * 100),
      total: Math.round(params.amount * 100),
      currency: 'CNY',
    },
  });

  const authHeader = await buildAuthHeader(config, 'POST', apiUrl, requestBody);

  const response = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader,
    },
    body: requestBody,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[微信支付] 退款失败:', data);
    throw new Error(`退款失败: ${data.message || response.statusText}`);
  }

  return {
    refundId: data.refund_id || '',
    status: data.status || 'PROCESSING',
  };
}

/**
 * 解析并验证微信支付回调通知
 */
export async function parseCallback(
  config: WechatPayConfig,
  rawBody: string,
  headers: Record<string, string>
): Promise<WechatCallbackData> {
  const body = JSON.parse(rawBody);

  if (body.event_type !== 'TRANSACTION.SUCCESS' && body.event_type !== 'TRANSACTION.FAIL') {
    throw new Error(`未知的事件类型: ${body.event_type}`);
  }

  // 解密资源数据
  const resource = body.resource;
  if (!resource) {
    throw new Error('回调数据缺少 resource 字段');
  }

  const decrypted = await decryptResource(
    config.apiV3Key,
    resource.associated_data,
    resource.nonce,
    resource.ciphertext
  );

  const data = JSON.parse(decrypted);

  return {
    orderNo: data.out_trade_no,
    transactionId: data.transaction_id,
    amount: data.amount?.total || 0,  // 分
    status: data.trade_state || 'FAILED',
  };
}
