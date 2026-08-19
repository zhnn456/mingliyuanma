/**
 * 支付服务抽象层
 * 支持微信支付、支付宝，可扩展更多支付渠道
 * 为 SaaS 多租户部署设计：每个代理商可配置独立支付参数
 */

import {
  createNativeOrder as wechatNativeOrder,
  createJsapiOrder as wechatJsapiOrder,
  queryOrder as wechatQueryOrder,
  createRefund as wechatRefund,
  parseCallback as wechatParseCallback,
  type WechatPayConfig,
} from './wechat';
import {
  createPagePayUrlAsync,
  createWapPayUrlAsync,
  queryTrade as alipayQueryTrade,
  createRefund as alipayRefund,
  parseCallback as alipayParseCallback,
  type AlipayConfig,
} from './alipay';
import {
  createOrder as zpayCreateOrder,
  parseCallback as zpayParseCallback,
  getZPayConfig,
  type ZPayConfig,
} from './zpay';

// ============ 类型定义 ============

export type PaymentMethod = 'wechat' | 'alipay' | 'paypal' | 'zpay' | 'personalqr' | 'mock';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'closed';

export interface PaymentConfig {
  method: PaymentMethod;
  // 微信支付
  wechatAppId?: string;
  wechatMchId?: string;
  wechatApiV3Key?: string;
  wechatPrivateKey?: string;
  wechatCertSerial?: string;
  wechatNotifyUrl?: string;
  // 支付宝
  alipayAppId?: string;
  alipayPrivateKey?: string;
  alipayPublicKey?: string;
  alipayNotifyUrl?: string;
  alipayReturnUrl?: string;
  alipayGateway?: string;
  // PayPal（PayPal.me 收款链接，由客服手动核销）
  paypalMeUsername?: string;
  // Z-Pay（易支付，无需备案，个人/个体工商户可用）
  zpayPid?: string;
  zpayKey?: string;
  zpayApiUrl?: string;
  // 个人收款码（微信/支付宝个人收款码，用户扫码付款后联系客服核销）
  personalQrUrl?: string;
  personalQrType?: 'wechat' | 'alipay' | 'unionpay';
  // 代理商配置（多租户）
  agentId?: string;
}

export interface CreateOrderParams {
  orderNo: string;
  amount: number;
  title: string;
  description?: string;
  method: PaymentMethod;
  userId: string;
  targetType: 'membership' | 'offering' | 'pdf_report' | 'recharge';
  targetId?: string;
  openid?: string;
  returnUrl?: string;
}

export interface CreateOrderResult {
  orderNo: string;
  paymentUrl?: string;
  qrCode?: string;
  prepayId?: string;
  jsapiParams?: Record<string, string>;
  status: PaymentStatus;
  // 个人收款码方案：返回收款码图片 URL，前端展示二维码（不跳转）
  paymentQrUrl?: string;
  paymentQrType?: 'wechat' | 'alipay' | 'unionpay';
  // PayPal 汇率信息
  amount?: number;
  usdAmount?: number;
  exchangeRate?: number;
}

export interface CallbackResult {
  success: boolean;
  orderNo: string;
  transactionId: string;
  amount: number;
  method: PaymentMethod;
}

// ============ 订单号生成 ============

export function generateOrderNo(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const buf = new Uint8Array(4);
  globalThis.crypto.getRandomValues(buf);
  const random = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const time = String(now.getTime()).slice(-6);
  return `ML${dateStr}${time}${random}`;
}

// ============ 会员套餐配置 ============

export interface MembershipPlanConfig {
  level: 'monthly' | 'yearly' | 'lifetime';
  name: string;
  price: number;
  durationDays: number | null;
  features: string[];
  popular?: boolean;
}

export const MEMBERSHIP_PLANS: MembershipPlanConfig[] = [
  {
    level: 'monthly',
    name: '月卡会员',
    price: 29.9,
    durationDays: 30,
    features: ['无限次排盘', '基础命理解读', '四大命理模块', '历史记录保存', '优先客服支持'],
  },
  {
    level: 'yearly',
    name: '年卡会员',
    price: 199,
    durationDays: 365,
    features: ['无限次排盘', '详细命理解读', '四大命理模块', '历史记录保存', '导出PDF报告', '专属运势分析', '优先新功能体验'],
    popular: true,
  },
  {
    level: 'lifetime',
    name: '终身会员',
    price: 599,
    durationDays: null,
    features: ['所有年卡权益', '终身免费更新', '一对一咨询', '专属命理课程', '优先新功能体验', '线下活动资格'],
  },
];

// ============ 支付服务 ============

export class PaymentService {
  constructor(private config: PaymentConfig) {}

  /**
   * 创建支付订单
   */
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    switch (params.method) {
      case 'wechat':
        return this.createWechatOrder(params);
      case 'alipay':
        return this.createAlipayOrder(params);
      case 'paypal':
        return this.createPaypalOrder(params);
      case 'zpay':
        return this.createZpayOrder(params);
      case 'personalqr':
        return this.createPersonalQrOrder(params);
      case 'mock':
        return this.createMockOrder(params);
      default:
        throw new Error(`不支持的支付方式: ${params.method}`);
    }
  }

  /**
   * 处理支付回调
   * 注：PayPal.me 暂不支持自动回调，由客服在后台手动核销
   */
  async handleCallback(method: PaymentMethod, rawBody: string, headers: Record<string, string>): Promise<CallbackResult> {
    switch (method) {
      case 'wechat':
        return this.handleWechatCallback(rawBody, headers);
      case 'alipay':
        return this.handleAlipayCallback(rawBody, headers);
      case 'zpay':
        return this.handleZpayCallback(rawBody);
      case 'mock':
        return this.handleMockCallback(rawBody);
      default:
        throw new Error(`不支持的支付方式: ${method}`);
    }
  }

  /**
   * 查询订单状态
   */
  async queryOrder(orderNo: string, method: PaymentMethod): Promise<PaymentStatus> {
    switch (method) {
      case 'wechat':
        return this.queryWechatOrder(orderNo);
      case 'alipay':
        return this.queryAlipayOrder(orderNo);
      // 以下支付方式无主动查询接口（无自动回调，由客服在后台核销）
      case 'paypal':
      case 'personalqr':
        return 'pending';
      case 'zpay':
        // Z-Pay 异步回调，查询走本地订单状态（无主动查询接口）
        return 'pending';
      case 'mock':
        return 'pending';
      default:
        return 'pending';
    }
  }

  /**
   * 申请退款
   */
  async refund(orderNo: string, amount: number, method: PaymentMethod, reason?: string): Promise<{ success: boolean; refundId?: string }> {
    const refundNo = `RF${Date.now()}`;
    try {
      switch (method) {
        case 'wechat': {
          if (!this.isWechatConfigured()) throw new Error('微信支付未配置');
          const config = this.getWechatConfig();
          const result = await wechatRefund(config, { orderNo, refundNo, amount, refundAmount: amount, reason });
          return { success: result.status === 'SUCCESS' || result.status === 'PROCESSING', refundId: result.refundId };
        }
        case 'alipay': {
          if (!this.isAlipayConfigured()) throw new Error('支付宝未配置');
          const config = this.getAlipayConfig();
          const result = await alipayRefund(config, { orderNo, refundNo, amount, refundAmount: amount, reason });
          return { success: result.status === 'SUCCESS', refundId: result.refundId };
        }
        case 'mock':
          return { success: true, refundId: `mock_rf_${Date.now()}` };
        // 无外部支付接口的支付方式：个人收款码、PayPal.me 由客服人工线下退款
        case 'personalqr':
        case 'paypal':
          console.warn(`[${method}] 不支持线上退款，需客服人工处理（线下原路退回）`);
          return { success: false, refundId: `manual_${refundNo}` };
        case 'zpay':
          // Z-Pay 退款需调用易支付退款接口，当前未实现，提示人工处理
          console.warn('[zpay] 退款接口未实现，需客服人工处理');
          return { success: false, refundId: `manual_${refundNo}` };
        default:
          return { success: false };
      }
    } catch (e) {
      console.error(`[支付] 退款失败 (${method}):`, e);
      return { success: false };
    }
  }

  // ============ 微信支付 ============

  private isWechatConfigured(): boolean {
    return !!(this.config.wechatAppId && this.config.wechatMchId && this.config.wechatPrivateKey);
  }

  private getWechatConfig(): WechatPayConfig {
    return {
      appId: this.config.wechatAppId!,
      mchId: this.config.wechatMchId!,
      apiV3Key: this.config.wechatApiV3Key || '',
      privateKey: this.config.wechatPrivateKey!,
      certSerial: this.config.wechatCertSerial || '',
      notifyUrl: this.config.wechatNotifyUrl || `${process.env.NEXTAUTH_URL}/api/payment/wechat/notify`,
    };
  }

  private async createWechatOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    // 未配置时降级为 mock
    if (!this.isWechatConfigured()) {
      console.warn('[微信支付] 未配置，降级为 mock 模式');
      return this.createMockOrder(params);
    }

    const config = this.getWechatConfig();

    // 有 openid 用 JSAPI，否则用 Native 扫码
    if (params.openid) {
      const result = await wechatJsapiOrder(config, {
        orderNo: params.orderNo,
        amount: params.amount,
        description: params.title,
        openid: params.openid,
      });
      return {
        orderNo: params.orderNo,
        prepayId: result.prepayId,
        jsapiParams: {
          timeStamp: result.timeStamp,
          nonceStr: result.nonceStr,
          package: result.package,
          signType: result.signType,
          paySign: result.paySign,
        },
        status: 'pending',
      };
    }

    // Native 扫码支付
    const result = await wechatNativeOrder(config, {
      orderNo: params.orderNo,
      amount: params.amount,
      description: params.title,
    });
    return {
      orderNo: params.orderNo,
      qrCode: result.codeUrl,
      status: 'pending',
    };
  }

  private async handleWechatCallback(rawBody: string, _headers: Record<string, string>): Promise<CallbackResult> {
    if (!this.isWechatConfigured()) {
      return this.handleMockCallback(rawBody);
    }

    const config = this.getWechatConfig();
    const data = await wechatParseCallback(config, rawBody, _headers);

    return {
      success: data.status === 'SUCCESS',
      orderNo: data.orderNo,
      transactionId: data.transactionId,
      amount: data.amount / 100, // 分转元
      method: 'wechat',
    };
  }

  private async queryWechatOrder(orderNo: string): Promise<PaymentStatus> {
    if (!this.isWechatConfigured()) return 'pending';
    const config = this.getWechatConfig();
    const result = await wechatQueryOrder(config, orderNo);
    const statusMap: Record<string, PaymentStatus> = {
      'SUCCESS': 'paid',
      'REFUND': 'refunded',
      'NOTPAY': 'pending',
      'CLOSED': 'closed',
      'REVOKED': 'closed',
      'USERPAYING': 'pending',
      'PAYERROR': 'failed',
    };
    return statusMap[result.status] || 'pending';
  }

  // ============ 支付宝 ============

  private isAlipayConfigured(): boolean {
    return !!(this.config.alipayAppId && this.config.alipayPrivateKey && this.config.alipayPublicKey);
  }

  private getAlipayConfig(): AlipayConfig {
    return {
      appId: this.config.alipayAppId!,
      privateKey: this.config.alipayPrivateKey!,
      publicKey: this.config.alipayPublicKey!,
      notifyUrl: this.config.alipayNotifyUrl || `${process.env.NEXTAUTH_URL}/api/payment/alipay/notify`,
      returnUrl: this.config.alipayReturnUrl,
      gateway: this.config.alipayGateway || 'https://openapi.alipay.com/gateway.do',
    };
  }

  private async createAlipayOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    // 未配置时降级为 mock
    if (!this.isAlipayConfigured()) {
      console.warn('[支付宝] 未配置，降级为 mock 模式');
      return this.createMockOrder(params);
    }

    const config = this.getAlipayConfig();

    // 判断是否手机端
    const isMobile = params.returnUrl?.includes('mobile') || false;

    let payUrl: string;
    if (isMobile) {
      payUrl = await createWapPayUrlAsync(config, {
        orderNo: params.orderNo,
        amount: params.amount,
        title: params.title,
        description: params.description,
        returnUrl: params.returnUrl,
      });
    } else {
      payUrl = await createPagePayUrlAsync(config, {
        orderNo: params.orderNo,
        amount: params.amount,
        title: params.title,
        description: params.description,
        returnUrl: params.returnUrl,
      });
    }

    return {
      orderNo: params.orderNo,
      paymentUrl: payUrl,
      status: 'pending',
    };
  }

  private async handleAlipayCallback(rawBody: string, _headers: Record<string, string>): Promise<CallbackResult> {
    if (!this.isAlipayConfigured()) {
      return this.handleMockCallback(rawBody);
    }

    const config = this.getAlipayConfig();

    // 解析 form-urlencoded
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(rawBody);
    searchParams.forEach((v, k) => { params[k] = v; });

    const data = await alipayParseCallback(config, params);

    return {
      success: data.status === 'TRADE_SUCCESS' || data.status === 'TRADE_FINISHED',
      orderNo: data.orderNo,
      transactionId: data.transactionId,
      amount: data.amount,
      method: 'alipay',
    };
  }

  private async queryAlipayOrder(orderNo: string): Promise<PaymentStatus> {
    if (!this.isAlipayConfigured()) return 'pending';
    const config = this.getAlipayConfig();
    const result = await alipayQueryTrade(config, orderNo);
    const statusMap: Record<string, PaymentStatus> = {
      'TRADE_SUCCESS': 'paid',
      'TRADE_FINISHED': 'paid',
      'WAIT_BUYER_PAY': 'pending',
      'TRADE_CLOSED': 'closed',
    };
    return statusMap[result.status] || 'pending';
  }

  // ============ PayPal（PayPal.me 收款） ============

  private isPaypalConfigured(): boolean {
    return !!this.config.paypalMeUsername;
  }

  /**
   * 创建 PayPal 订单
   * 跳转到 PayPal.me 让用户手动输入金额付款
   * 付款后由客服在后台手动核销订单（无自动回调）
   *
   * 汇率折算：PayPal.me 默认以美元结算，需将人民币金额转换为美元
   * 汇率通过环境变量 PAYPAL_USD_RATE 配置（默认 7.15，即 1 USD ≈ 7.15 CNY）
   */
  private async createPaypalOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    if (!this.isPaypalConfigured()) {
      console.warn('[PayPal] 未配置 paypalMeUsername，降级为 mock 模式');
      return this.createMockOrder(params);
    }

    // 人民币 → 美元折算
    const rate = parseFloat(process.env.PAYPAL_USD_RATE || '7.15');
    const usdAmount = params.amount / rate;
    const amountStr = usdAmount.toFixed(2);
    const paymentUrl = `https://paypal.me/${this.config.paypalMeUsername}/${amountStr}`;

    return {
      orderNo: params.orderNo,
      paymentUrl,
      status: 'pending',
      // 附加汇率信息供前端展示
      amount: params.amount,
      usdAmount,
      exchangeRate: rate,
    } as CreateOrderResult;
  }

  // ============ Z-Pay（易支付） ============

  private isZpayConfigured(): boolean {
    return !!(this.config.zpayPid && this.config.zpayKey);
  }

  private getZpayConfig(): ZPayConfig {
    return {
      pid: this.config.zpayPid!,
      key: this.config.zpayKey!,
      apiUrl: this.config.zpayApiUrl || 'https://api.z-pay.cn/submit.php',
      notifyUrl: `${process.env.NEXTAUTH_URL}/api/payment/zpay/notify`,
      returnUrl: `${process.env.NEXTAUTH_URL}/payment/result`,
    };
  }

  private async createZpayOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    if (!this.isZpayConfigured()) {
      console.warn('[Z-Pay] 未配置，降级为 mock 模式');
      return this.createMockOrder(params);
    }

    const config = this.getZpayConfig();
    const result = zpayCreateOrder(config, {
      orderNo: params.orderNo,
      amount: params.amount,
      title: params.title,
      type: 'alipay',
    });

    return {
      orderNo: params.orderNo,
      paymentUrl: result.paymentUrl,
      status: 'pending',
    };
  }

  // ============ 个人收款码（微信/支付宝个人收款码） ============

  /**
   * 创建个人收款码订单
   *
   * 工作流程：
   * 1. 后端创建 pending 订单（不调用任何外部支付接口）
   * 2. 前端展示后台配置的个人收款码图片（微信/支付宝）
   * 3. 用户扫码付款后，联系客服核销订单（无自动回调）
   *
   * 适用场景：个人站、早期小单量、无公司资质、零费率
   */
  private async createPersonalQrOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    if (!this.isPersonalQrConfigured()) {
      console.warn('[个人收款码] 未配置 personalQrUrl，降级为 mock 模式');
      return this.createMockOrder(params);
    }

    // 不跳转外部页面，前端通过 paymentQrUrl 展示收款码
    return {
      orderNo: params.orderNo,
      // paymentUrl 留空表示不跳转，前端应读取 paymentQrUrl 展示二维码
      paymentUrl: '',
      status: 'pending',
      // 附加信息供前端展示
      amount: params.amount,
      paymentQrUrl: this.config.personalQrUrl,
      paymentQrType: this.config.personalQrType || 'wechat',
    } as CreateOrderResult;
  }

  private isPersonalQrConfigured(): boolean {
    return !!this.config.personalQrUrl;
  }

  private async handleZpayCallback(rawBody: string): Promise<CallbackResult> {
    if (!this.isZpayConfigured()) {
      return this.handleMockCallback(rawBody);
    }

    // Z-Pay 回调是 GET 请求，参数在 URL query string 中
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(rawBody);
    searchParams.forEach((v, k) => { params[k] = v; });

    const config = this.getZpayConfig();
    const data = zpayParseCallback(params, config);

    return {
      success: true,
      orderNo: data.orderNo,
      transactionId: data.transactionId,
      amount: data.amount,
      method: 'zpay',
    };
  }

  // ============ Mock 支付（开发/测试用） ============

  private async createMockOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    return {
      orderNo: params.orderNo,
      qrCode: `mock://pay/${params.orderNo}?amount=${params.amount}`,
      paymentUrl: `/pay/${params.orderNo}`,
      status: 'pending',
    };
  }

  private async handleMockCallback(rawBody: string): Promise<CallbackResult> {
    let data: any;
    try {
      data = JSON.parse(rawBody);
    } catch {
      throw new Error('Mock 回调解析失败');
    }
    const amount = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount);
    return {
      success: true,
      orderNo: data.orderNo || '',
      transactionId: `mock_tx_${Date.now()}`,
      amount: isNaN(amount) ? 0 : amount,
      method: 'mock',
    };
  }
}

// ============ 工厂函数 ============

/**
 * 同步读取支付配置（仅从环境变量，保留向后兼容）
 * @deprecated 新代码应使用异步的 createPaymentService()，它会优先读取后台 DB 配置
 */
export function getPaymentConfig(agentId?: string): PaymentConfig {
  const baseConfig: PaymentConfig = {
    method: (process.env.PAYMENT_DEFAULT_METHOD as PaymentMethod) || 'mock',
    // 微信支付
    wechatAppId: process.env.WECHAT_APP_ID,
    wechatMchId: process.env.WECHAT_MCH_ID,
    wechatApiV3Key: process.env.WECHAT_API_V3_KEY,
    wechatPrivateKey: process.env.WECHAT_PRIVATE_KEY,
    wechatCertSerial: process.env.WECHAT_CERT_SERIAL,
    wechatNotifyUrl: process.env.WECHAT_NOTIFY_URL,
    // 支付宝
    alipayAppId: process.env.ALIPAY_APP_ID,
    alipayPrivateKey: process.env.ALIPAY_PRIVATE_KEY,
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
    alipayNotifyUrl: process.env.ALIPAY_NOTIFY_URL,
    alipayReturnUrl: process.env.ALIPAY_RETURN_URL,
    alipayGateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
    // PayPal（PayPal.me 用户名，用于跳转收款）
    paypalMeUsername: process.env.PAYPAL_ME_USERNAME,
    // Z-Pay（易支付，无需备案）
    zpayPid: process.env.ZPAY_PID,
    zpayKey: process.env.ZPAY_KEY,
    zpayApiUrl: process.env.ZPAY_API_URL || 'https://api.z-pay.cn/submit.php',
    agentId,
  };

  return baseConfig;
}

/**
 * 创建支付服务（异步，优先读取后台 DB 配置）
 *
 * 配置优先级：后台 DB 配置（/admin/payment-config 页面配置）> .env 环境变量 > 默认值
 * 这样管理员在后台修改的配置能立即生效，无需改 .env 重启服务。
 */
export async function createPaymentService(agentId?: string): Promise<PaymentService> {
  const { loadPaymentConfig } = await import('./config');
  const dbConfig = await loadPaymentConfig(agentId);
  const config: PaymentConfig = {
    method: (process.env.PAYMENT_DEFAULT_METHOD as PaymentMethod) || 'mock',
    wechatAppId: dbConfig.wechatAppId,
    wechatMchId: dbConfig.wechatMchId,
    wechatApiV3Key: dbConfig.wechatApiV3Key,
    wechatPrivateKey: dbConfig.wechatPrivateKey,
    wechatCertSerial: dbConfig.wechatCertSerial,
    wechatNotifyUrl: dbConfig.wechatNotifyUrl,
    alipayAppId: dbConfig.alipayAppId,
    alipayPrivateKey: dbConfig.alipayPrivateKey,
    alipayPublicKey: dbConfig.alipayPublicKey,
    alipayNotifyUrl: dbConfig.alipayNotifyUrl,
    alipayReturnUrl: dbConfig.alipayReturnUrl,
    alipayGateway: dbConfig.alipayGateway,
    paypalMeUsername: dbConfig.paypalMeUsername,
    zpayPid: dbConfig.zpayPid,
    zpayKey: dbConfig.zpayKey,
    zpayApiUrl: dbConfig.zpayApiUrl,
    // 个人收款码（DB 优先，fallback env）
    personalQrUrl: dbConfig.personalQrUrl || process.env.PERSONAL_QR_URL,
    personalQrType: dbConfig.personalQrType || (process.env.PERSONAL_QR_TYPE as any) || 'wechat',
    agentId,
  };
  return new PaymentService(config);
}
