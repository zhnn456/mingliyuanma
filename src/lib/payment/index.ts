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

// ============ 类型定义 ============

export type PaymentMethod = 'wechat' | 'alipay' | 'paypal' | 'mock';
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
  targetType: 'membership' | 'offering' | 'pdf_report';
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
      case 'mock':
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
   */
  private async createPaypalOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    if (!this.isPaypalConfigured()) {
      console.warn('[PayPal] 未配置 paypalMeUsername，降级为 mock 模式');
      return this.createMockOrder(params);
    }

    // PayPal.me 链接：https://paypal.me/{username}/{金额}
    // 金额需为数字，保留两位小数
    const amountStr = params.amount.toFixed(2);
    const paymentUrl = `https://paypal.me/${this.config.paypalMeUsername}/${amountStr}`;

    return {
      orderNo: params.orderNo,
      paymentUrl,
      status: 'pending',
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
    agentId,
  };

  return baseConfig;
}

export function createPaymentService(agentId?: string): PaymentService {
  const config = getPaymentConfig(agentId);
  return new PaymentService(config);
}
