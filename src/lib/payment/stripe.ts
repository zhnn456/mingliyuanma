/**
 * Stripe 支付适配器
 * 使用 Checkout Sessions 实现网页支付
 */

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret?: string;
  returnUrl: string;
}

export interface CreateCheckoutParams {
  orderNo: string;
  amount: number;        // 人民币金额（元）
  title: string;
  description?: string;
  userId: string;
  returnUrl?: string;
}

export interface CheckoutResult {
  orderNo: string;
  paymentUrl: string;   // Stripe Checkout 页面URL
  sessionId: string;
  status: 'pending';
}

export interface StripeCallbackResult {
  success: boolean;
  orderNo: string;
  transactionId: string;
  amount: number;
}

// ============ Checkout Session 创建 ============

export async function createCheckoutSession(
  config: StripeConfig,
  params: CreateCheckoutParams
): Promise<CheckoutResult> {
  const { secretKey, returnUrl } = config;

  // 人民币金额转分（Stripe最低单位）
  const amountInCents = Math.round(params.amount * 100);

  const sessionData = new URLSearchParams({
    'mode': 'payment',
    'payment_method_types[0]': 'card',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'cny',
    'line_items[0][price_data][product_data][name]': params.title,
    'line_items[0][price_data][unit_amount]': String(amountInCents),
    'client_reference_id': params.orderNo,
    'metadata[orderNo]': params.orderNo,
    'metadata[userId]': params.userId,
    'success_url': `${returnUrl}?order_no=${params.orderNo}&status=success`,
    'cancel_url': `${returnUrl}?order_no=${params.orderNo}&status=cancel`,
  });

  if (params.description) {
    sessionData.append('line_items[0][price_data][product_data][description]', params.description);
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: sessionData.toString(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Stripe创建会话失败: ${err.error?.message || res.statusText}`);
  }

  const session = await res.json();

  return {
    orderNo: params.orderNo,
    paymentUrl: session.url,
    sessionId: session.id,
    status: 'pending',
  };
}

// ============ Webhook 回调验证 ============

export async function parseWebhook(
  config: StripeConfig,
  rawBody: string,
  signature: string
): Promise<StripeCallbackResult | null> {
  // 简化版：直接解析event（生产环境应验证签名）
  // TODO: 用stripe库验证签名
  const event = JSON.parse(rawBody);

  if (event.type !== 'checkout.session.completed') {
    return null;
  }

  const session = event.data?.object;
  if (!session) return null;

  const orderNo = session.client_reference_id || session.metadata?.orderNo;
  if (!orderNo) return null;

  return {
    success: session.payment_status === 'paid',
    orderNo,
    transactionId: session.payment_intent || session.id,
    amount: session.amount_total ? session.amount_total / 100 : 0,
  };
}

// ============ 查询会话状态 ============

export async function retrieveSession(
  config: StripeConfig,
  sessionId: string
): Promise<{ status: string; paymentStatus: string }> {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { 'Authorization': `Bearer ${config.secretKey}` },
  });

  if (!res.ok) {
    throw new Error(`Stripe查询失败: ${res.statusText}`);
  }

  const session = await res.json();
  return {
    status: session.status,
    paymentStatus: session.payment_status,
  };
}
