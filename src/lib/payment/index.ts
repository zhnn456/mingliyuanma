/**
 * 支付服务抽象层
 * 支持微信支付、支付宝，可扩展更多支付渠道
 * 为 SaaS 多租户部署设计：每个代理商可配置独立支付参数
 */

// ============ 类型定义 ============

export type PaymentMethod = 'wechat' | 'alipay' | 'mock';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'closed';

export interface PaymentConfig {
  method: PaymentMethod;
  // 微信支付
  wechatAppId?: string;
  wechatMchId?: string;
  wechatApiKey?: string;
  wechatNotifyUrl?: string;
  // 支付宝
  alipayAppId?: string;
  alipayPrivateKey?: string;
  alipayPublicKey?: string;
  alipayNotifyUrl?: string;
  // 代理商配置（多租户）
  agentId?: string;
}

export interface CreateOrderParams {
  orderNo: string;
  amount: number; // 金额（元）
  title: string;
  description?: string;
  method: PaymentMethod;
  userId: string;
  targetType: 'membership' | 'offering' | 'pdf_report';
  targetId?: string;
  openid?: string; // 微信 openid（可选）
  returnUrl?: string; // 支付完成跳转URL
}

export interface CreateOrderResult {
  orderNo: string;
  paymentUrl?: string; // 支付链接（H5/扫码）
  qrCode?: string; // 二维码内容
  prepayId?: string; // 微信预支付ID
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
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  const time = String(now.getTime()).slice(-6);
  return `ML${dateStr}${time}${random}`;
}

// ============ 会员套餐配置 ============

export interface MembershipPlanConfig {
  level: 'monthly' | 'yearly' | 'lifetime';
  name: string;
  price: number;
  durationDays: number | null; // null = 终身
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
      case 'mock':
        return this.createMockOrder(params);
      default:
        throw new Error(`不支持的支付方式: ${params.method}`);
    }
  }

  /**
   * 处理支付回调
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

  // ============ 微信支付 ============

  private async createWechatOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    // TODO: 实际微信支付API调用
    // 当前为模拟实现，生产环境替换为真实API
    if (!this.config.wechatAppId || !this.config.wechatMchId) {
      // 降级为 mock 模式
      return this.createMockOrder(params);
    }

    try {
      // 真实微信支付统一下单 API
      // const response = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', { ... });
      // 解析返回的 prepay_id, code_url 等

      return {
        orderNo: params.orderNo,
        qrCode: `weixin://wxpay/bizpayurl?pr=${params.orderNo}`,
        prepayId: `wx_${params.orderNo}`,
        status: 'pending',
      };
    } catch (error) {
      console.error('微信支付创建订单失败:', error);
      throw new Error('微信支付创建订单失败');
    }
  }

  private async handleWechatCallback(rawBody: string, _headers: Record<string, string>): Promise<CallbackResult> {
    // TODO: 实际微信支付回调验证
    // 1. 验证签名
    // 2. 解析 XML 数据
    // 3. 验证金额

    try {
      // 模拟解析
      const data = JSON.parse(rawBody);
      return {
        success: true,
        orderNo: data.orderNo,
        transactionId: data.transactionId || `wx_tx_${Date.now()}`,
        amount: data.amount,
        method: 'wechat',
      };
    } catch {
      throw new Error('微信支付回调解析失败');
    }
  }

  // ============ 支付宝 ============

  private async createAlipayOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    if (!this.config.alipayAppId) {
      return this.createMockOrder(params);
    }

    try {
      // TODO: 实际支付宝API调用
      // 构建支付宝支付链接

      return {
        orderNo: params.orderNo,
        paymentUrl: `https://openapi.alipaydev.com/gateway.do?out_trade_no=${params.orderNo}`,
        status: 'pending',
      };
    } catch (error) {
      console.error('支付宝创建订单失败:', error);
      throw new Error('支付宝创建订单失败');
    }
  }

  private async handleAlipayCallback(rawBody: string, _headers: Record<string, string>): Promise<CallbackResult> {
    // TODO: 实际支付宝回调验证
    try {
      const params = new URLSearchParams(rawBody);
      const orderNo = params.get('out_trade_no') || '';
      const transactionId = params.get('trade_no') || '';
      const amount = parseFloat(params.get('total_amount') || '0');

      return {
        success: params.get('trade_status') === 'TRADE_SUCCESS',
        orderNo,
        transactionId,
        amount,
        method: 'alipay',
      };
    } catch {
      throw new Error('支付宝回调解析失败');
    }
  }

  // ============ Mock 支付（开发/测试用） ============

  private async createMockOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    return {
      orderNo: params.orderNo,
      qrCode: `mock://pay/${params.orderNo}?amount=${params.amount}`,
      paymentUrl: `/payment/mock?orderNo=${params.orderNo}`,
      status: 'pending',
    };
  }

  private async handleMockCallback(rawBody: string): Promise<CallbackResult> {
    const data = JSON.parse(rawBody);
    return {
      success: true,
      orderNo: data.orderNo,
      transactionId: `mock_tx_${Date.now()}`,
      amount: data.amount,
      method: 'mock',
    };
  }

  // ============ 查询订单状态 ============

  async queryOrder(orderNo: string, method: PaymentMethod): Promise<PaymentStatus> {
    // TODO: 实际查询API
    // 当前返回 mock 状态
    return 'pending';
  }
}

// ============ 工厂函数 ============

/**
 * 获取支付配置（支持多租户：代理商可有自己的支付配置）
 */
export function getPaymentConfig(agentId?: string): PaymentConfig {
  // 从环境变量读取平台默认配置
  const baseConfig: PaymentConfig = {
    method: (process.env.PAYMENT_DEFAULT_METHOD as PaymentMethod) || 'mock',
    wechatAppId: process.env.WECHAT_APP_ID,
    wechatMchId: process.env.WECHAT_MCH_ID,
    wechatApiKey: process.env.WECHAT_API_KEY,
    wechatNotifyUrl: process.env.WECHAT_NOTIFY_URL,
    alipayAppId: process.env.ALIPAY_APP_ID,
    alipayPrivateKey: process.env.ALIPAY_PRIVATE_KEY,
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
    alipayNotifyUrl: process.env.ALIPAY_NOTIFY_URL,
    agentId,
  };

  // 如果是代理商，可从数据库读取代理商的支付配置覆盖
  // TODO: 实现 agent-specific payment config

  return baseConfig;
}

/**
 * 创建支付服务实例
 */
export function createPaymentService(agentId?: string): PaymentService {
  const config = getPaymentConfig(agentId);
  return new PaymentService(config);
}
