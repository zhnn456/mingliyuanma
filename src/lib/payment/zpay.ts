/**
 * Z-Pay (易支付) 支付接口
 * 无需备案，个人/个体工商户均可接入
 * 
 * 签名规则：
 * 1. 所有请求参数按参数名 ASCII 码排序
 * 2. 排除 sign、sign_type 参数
 * 3. 排除空值参数
 * 4. 拼接为 key=value&key=value 格式
 * 5. 末尾拼接商户密钥 &key=商户密钥
 * 6. MD5 加密得到签名
 * 
 * 回调要求：
 * - 回调接口必须返回字符串 'success' 确认收款
 * - 重试策略：0/15/15/30/180/1800 秒
 */

import crypto from 'crypto';

export interface ZPayConfig {
  /** 商户ID */
  pid: string;
  /** 商户密钥 */
  key: string;
  /** 支付网关地址 */
  apiUrl: string;
  /** 异步回调地址 */
  notifyUrl: string;
  /** 同步跳转地址 */
  returnUrl: string;
}

export interface ZPayCreateOrderParams {
  /** 商户订单号 */
  orderNo: string;
  /** 订单金额（元） */
  amount: number;
  /** 商品名称 */
  title: string;
  /** 支付方式：alipay / wxpay */
  type?: 'alipay' | 'wxpay';
  /** 同步跳转地址（覆盖配置） */
  returnUrl?: string;
}

export interface ZPayCreateOrderResult {
  /** 支付跳转 URL */
  paymentUrl: string;
  /** 二维码链接（扫码支付） */
  qrcode?: string;
  /** 订单号 */
  orderNo: string;
}

export interface ZPayCallbackParams {
  pid: string;
  trade_no: string;
  out_trade_no: string;
  type: string;
  name: string;
  money: string;
  trade_status: string;
  sign: string;
  sign_type: string;
  [key: string]: string;
}

export interface ZPayCallbackResult {
  success: boolean;
  orderNo: string;
  transactionId: string;
  amount: number;
  method: 'alipay' | 'wxpay';
}

/**
 * 生成 Z-Pay 签名
 */
function generateSign(params: Record<string, string | number | undefined>, key: string): string {
  // 1. 过滤空值和 sign/sign_type
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k === 'sign' || k === 'sign_type') continue;
    if (v === undefined || v === null || v === '') continue;
    filtered[k] = String(v);
  }

  // 2. 按 key ASCII 排序
  const sorted = Object.keys(filtered).sort();
  
  // 3. 拼接字符串
  const signStr = sorted.map(k => `${k}=${filtered[k]}`).join('&') + key;
  
  // 4. MD5
  return crypto.createHash('md5').update(signStr).digest('hex');
}

/**
 * 创建 Z-Pay 支付订单
 * 返回支付跳转 URL
 */
export function createOrder(config: ZPayConfig, params: ZPayCreateOrderParams): ZPayCreateOrderResult {
  const payType = params.type || 'alipay';
  
  const signParams: Record<string, string | number | undefined> = {
    pid: config.pid,
    type: payType,
    out_trade_no: params.orderNo,
    notify_url: config.notifyUrl,
    return_url: params.returnUrl || config.returnUrl,
    name: params.title,
    money: params.amount.toFixed(2),
    clientip: '127.0.0.1',
  };

  const sign = generateSign(signParams, config.key);
  signParams.sign = sign;
  signParams.sign_type = 'MD5';

  // 构建提交 URL（GET 方式提交）
  const queryString = Object.entries(signParams)
    .filter(([k, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

  const paymentUrl = `${config.apiUrl}?${queryString}`;

  return {
    paymentUrl,
    orderNo: params.orderNo,
  };
}

/**
 * 验证 Z-Pay 回调签名
 * 注意：回调参数中 sign 字段需要排除在签名计算之外
 */
export function verifyCallback(params: Record<string, string>, key: string): boolean {
  const receivedSign = params.sign;
  if (!receivedSign) return false;

  // 用同样的参数重新计算签名
  const signParams: Record<string, string | number | undefined> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k === 'sign' || k === 'sign_type') continue;
    signParams[k] = v;
  }

  const calculatedSign = generateSign(signParams, key);
  return calculatedSign === receivedSign;
}

/**
 * 解析 Z-Pay 回调参数
 */
export function parseCallback(params: Record<string, string>, config: ZPayConfig): ZPayCallbackResult {
  // 1. 验证签名
  if (!verifyCallback(params, config.key)) {
    throw new Error('Z-Pay 回调签名验证失败');
  }

  // 2. 验证商户ID
  if (params.pid !== config.pid) {
    throw new Error('Z-Pay 回调商户ID不匹配');
  }

  // 3. 验证交易状态
  if (params.trade_status !== 'TRADE_SUCCESS') {
    throw new Error(`Z-Pay 回调交易状态异常: ${params.trade_status}`);
  }

  const method = params.type === 'wxpay' ? 'wxpay' : 'alipay';
  const amount = parseFloat(params.money);

  if (isNaN(amount) || amount <= 0) {
    throw new Error('Z-Pay 回调金额异常');
  }

  return {
    success: true,
    orderNo: params.out_trade_no,
    transactionId: params.trade_no,
    amount,
    method,
  };
}

/**
 * 获取 Z-Pay 配置（从环境变量）
 */
export function getZPayConfig(): ZPayConfig {
  const pid = process.env.ZPAY_PID;
  const key = process.env.ZPAY_KEY;
  const apiUrl = process.env.ZPAY_API_URL || 'https://api.z-pay.cn/submit.php';
  const baseUrl = process.env.NEXTAUTH_URL || 'https://ming8.online';

  if (!pid || !key) {
    throw new Error('Z-Pay 未配置：请在 .env 中设置 ZPAY_PID 和 ZPAY_KEY');
  }

  return {
    pid,
    key,
    apiUrl,
    notifyUrl: `${baseUrl}/api/payment/zpay/notify`,
    returnUrl: `${baseUrl}/pay/result`,
  };
}