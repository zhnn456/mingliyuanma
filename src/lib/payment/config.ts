/**
 * 支付配置共享加载器
 *
 * 统一从 SiteConfig 表读取后台管理页面配置的支付参数（加密存储），
 * 解密敏感字段后返回完整 PaymentConfig。
 *
 * 优先级：DB 配置 > 环境变量（.env）> 默认值
 * 这样管理员在后台修改的配置能立即生效，无需改 .env 重启服务。
 *
 * 复用自 api/admin/payment-config/route.ts 的加密/解密逻辑。
 */
import { queryFirst } from '@/lib/d1';

const CONFIG_KEY = 'payment_config';
const CONFIG_CATEGORY = 'system';
const FALLBACK_SECRET = 'zhiwei-secret-key-2026-production';

// ==================== 密钥与加密（AES-GCM） ====================

async function getSecret(): Promise<string> {
  try {
    if (process.env?.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
  } catch {}
  return FALLBACK_SECRET;
}

async function getAesKey(): Promise<CryptoKey> {
  const secret = await getSecret();
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('mingli-payment-config-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function decryptSecret(stored: string): Promise<string> {
  if (!stored) return '';
  try {
    const key = await getAesKey();
    const combined = base64ToBytes(stored);
    if (combined.length < 13) return '';
    const iv = combined.slice(0, 12);
    const ct = combined.slice(12);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(pt);
  } catch (e) {
    console.error('[payment-config] 解密失败:', e);
    return '';
  }
}

// ==================== 配置读取 ====================

interface StoredConfig {
  // 非敏感字段
  wechatAppId?: string;
  wechatMchId?: string;
  wechatApiV3Key?: string;
  wechatCertSerial?: string;
  wechatNotifyUrl?: string;
  alipayAppId?: string;
  alipayNotifyUrl?: string;
  alipayReturnUrl?: string;
  alipayGateway?: string;
  zpayPid?: string;
  zpayApiUrl?: string;
  zpayNotifyUrl?: string;
  zpayReturnUrl?: string;
  paypalClientId?: string;
  paypalMode?: string;
  paypalNotifyUrl?: string;
  stripePublishableKey?: string;
  stripeWebhookSecret?: string;
  stripeNotifyUrl?: string;
  // 个人收款码
  personalQrUrl?: string;
  personalQrType?: 'wechat' | 'alipay' | 'unionpay';
  enabledMethods?: string[];
  // 敏感字段（加密存储）
  wechatPrivateKeyEnc?: string;
  alipayPrivateKeyEnc?: string;
  alipayPublicKeyEnc?: string;
  zpayKeyEnc?: string;
  paypalClientSecretEnc?: string;
  stripeSecretKeyEnc?: string;
}

async function loadStored(): Promise<StoredConfig | null> {
  const row = await queryFirst(
    'SELECT value FROM SiteConfig WHERE category = ? AND `key` = ?',
    CONFIG_CATEGORY, CONFIG_KEY
  ) as any;
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as StoredConfig;
  } catch {
    return null;
  }
}

// ==================== 对外接口 ====================

/**
 * 各支付方式是否已配置（供 status API 展示"未配置"标记）
 * 优先读取 DB 配置，fallback 到 env
 */
export async function getMethodsConfiguredState(): Promise<{
  wechat: boolean;
  alipay: boolean;
  paypal: boolean;
  zpay: boolean;
  personalqr: boolean;
  cardkey: boolean;
}> {
  const stored = await loadStored();
  return {
    wechat: !!(stored?.wechatAppId && stored?.wechatMchId && stored?.wechatPrivateKeyEnc)
      || !!(process.env.WECHAT_APP_ID && process.env.WECHAT_MCH_ID && process.env.WECHAT_PRIVATE_KEY),
    alipay: !!(stored?.alipayAppId && stored?.alipayPrivateKeyEnc && stored?.alipayPublicKeyEnc)
      || !!(process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY && process.env.ALIPAY_PUBLIC_KEY),
    // PayPal：后端使用 PayPal.me 收款方案，优先读 DB 的 paypalClientId 作为 paypalMeUsername，
    // 兼容 PAYPAL_ME_USERNAME 环境变量
    paypal: !!(stored?.paypalClientId) || !!process.env.PAYPAL_ME_USERNAME,
    zpay: !!(stored?.zpayPid && stored?.zpayKeyEnc) || !!(process.env.ZPAY_PID && process.env.ZPAY_KEY),
    // 个人收款码：只需配置收款码图片URL即可
    personalqr: !!stored?.personalQrUrl || !!process.env.PERSONAL_QR_URL,
    cardkey: true,
  };
}

/**
 * 加载完整支付配置（DB 优先，fallback 到 env）
 * 供 PaymentService 使用，使后台配置真正生效
 */
export async function loadPaymentConfig(agentId?: string) {
  const stored = await loadStored();

  // 解密敏感字段（DB 优先，fallback env）
  const wechatPrivateKey = stored?.wechatPrivateKeyEnc
    ? await decryptSecret(stored.wechatPrivateKeyEnc)
    : (process.env.WECHAT_PRIVATE_KEY || '');
  const alipayPrivateKey = stored?.alipayPrivateKeyEnc
    ? await decryptSecret(stored.alipayPrivateKeyEnc)
    : (process.env.ALIPAY_PRIVATE_KEY || '');
  const alipayPublicKey = stored?.alipayPublicKeyEnc
    ? await decryptSecret(stored.alipayPublicKeyEnc)
    : (process.env.ALIPAY_PUBLIC_KEY || '');
  const zpayKey = stored?.zpayKeyEnc
    ? await decryptSecret(stored.zpayKeyEnc)
    : (process.env.ZPAY_KEY || '');

  // PayPal：DB 的 paypalClientId 作为 PayPal.me username（后端使用 PayPal.me 收款方案）
  const paypalMeUsername = stored?.paypalClientId || process.env.PAYPAL_ME_USERNAME || '';

  return {
    // 微信支付
    wechatAppId: stored?.wechatAppId || process.env.WECHAT_APP_ID,
    wechatMchId: stored?.wechatMchId || process.env.WECHAT_MCH_ID,
    wechatApiV3Key: stored?.wechatApiV3Key || process.env.WECHAT_API_V3_KEY,
    wechatPrivateKey,
    wechatCertSerial: stored?.wechatCertSerial || process.env.WECHAT_CERT_SERIAL,
    wechatNotifyUrl: stored?.wechatNotifyUrl || process.env.WECHAT_NOTIFY_URL,
    // 支付宝
    alipayAppId: stored?.alipayAppId || process.env.ALIPAY_APP_ID,
    alipayPrivateKey,
    alipayPublicKey,
    alipayNotifyUrl: stored?.alipayNotifyUrl || process.env.ALIPAY_NOTIFY_URL,
    alipayReturnUrl: stored?.alipayReturnUrl || process.env.ALIPAY_RETURN_URL,
    alipayGateway: stored?.alipayGateway || process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
    // PayPal.me 收款（DB 的 paypalClientId 字段作为 username）
    paypalMeUsername,
    // Z-Pay
    zpayPid: stored?.zpayPid || process.env.ZPAY_PID,
    zpayKey,
    zpayApiUrl: stored?.zpayApiUrl || process.env.ZPAY_API_URL || 'https://api.z-pay.cn/submit.php',
    // 个人收款码（微信/支付宝个人收款码图片URL）
    personalQrUrl: stored?.personalQrUrl || process.env.PERSONAL_QR_URL,
    personalQrType: stored?.personalQrType || (process.env.PERSONAL_QR_TYPE as any) || 'wechat',
    // 启用的支付方式
    enabledMethods: stored?.enabledMethods || [],
    agentId,
  };
}
