import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { queryFirst, execute } from '@/lib/d1';
import {
  queryOrder as wechatQueryOrder,
  type WechatPayConfig,
} from '@/lib/payment/wechat';
import {
  queryTrade as alipayQueryTrade,
  type AlipayConfig,
} from '@/lib/payment/alipay';

// ==================== 常量 ====================

const CONFIG_KEY = 'payment_config';
const CONFIG_CATEGORY = 'system';

const FALLBACK_SECRET = 'mingli-secret-key-2026-production';

// ==================== 密钥与加密（AES-GCM，基于 Web Crypto） ====================

async function getSecret(): Promise<string> {
  // 普通服务器通过 process.env 注入密钥
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function encryptSecret(plain: string): Promise<string> {
  if (!plain) return '';
  try {
    const key = await getAesKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plain)
    );
    const ctBytes = new Uint8Array(ct);
    const combined = new Uint8Array(iv.length + ctBytes.length);
    combined.set(iv, 0);
    combined.set(ctBytes, iv.length);
    return bytesToBase64(combined);
  } catch (e) {
    console.error('[payment-config] 加密失败:', e);
    return '';
  }
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

// ==================== 配置读写 ====================

interface StoredConfig {
  // 非敏感字段（明文存储）
  wechatAppId?: string;
  wechatMchId?: string;
  wechatApiV3Key?: string;
  wechatCertSerial?: string;
  wechatNotifyUrl?: string;
  alipayAppId?: string;
  alipayNotifyUrl?: string;
  alipayReturnUrl?: string;
  alipayGateway?: string;
  // 敏感字段（加密存储）
  wechatPrivateKeyEnc?: string;
  alipayPrivateKeyEnc?: string;
  alipayPublicKeyEnc?: string;
}

async function loadStored(): Promise<{ data: StoredConfig | null; updatedAt: string }> {
  const row = await queryFirst(
    'SELECT value, updatedAt FROM SiteConfig WHERE category = ? AND key = ?',
    CONFIG_CATEGORY, CONFIG_KEY
  ) as any;
  if (!row?.value) return { data: null, updatedAt: '' };
  try {
    return { data: JSON.parse(row.value) as StoredConfig, updatedAt: row.updatedAt || '' };
  } catch {
    return { data: null, updatedAt: row.updatedAt || '' };
  }
}

async function saveStored(data: StoredConfig): Promise<void> {
  const now = new Date().toISOString();
  const value = JSON.stringify(data);
  const existing = await queryFirst('SELECT id FROM SiteConfig WHERE key = ?', CONFIG_KEY) as any;
  if (existing) {
    await execute(
      'UPDATE SiteConfig SET value = ?, category = ?, updatedAt = ? WHERE key = ?',
      value, CONFIG_CATEGORY, now, CONFIG_KEY
    );
  } else {
    const id = `cfg_${Date.now()}`;
    await execute(
      'INSERT INTO SiteConfig (id, key, value, category, description, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      id, CONFIG_KEY, value, CONFIG_CATEGORY, '支付参数配置（微信/支付宝）', now
    );
  }
}

/** 解密并组装完整的 PaymentConfig（用于测试连接） */
async function buildDecryptedConfig(stored: StoredConfig | null) {
  if (!stored) return null;
  return {
    wechatAppId: stored.wechatAppId || '',
    wechatMchId: stored.wechatMchId || '',
    wechatApiV3Key: stored.wechatApiV3Key || '',
    wechatCertSerial: stored.wechatCertSerial || '',
    wechatNotifyUrl: stored.wechatNotifyUrl || '',
    wechatPrivateKey: stored.wechatPrivateKeyEnc ? await decryptSecret(stored.wechatPrivateKeyEnc) : '',
    alipayAppId: stored.alipayAppId || '',
    alipayNotifyUrl: stored.alipayNotifyUrl || '',
    alipayReturnUrl: stored.alipayReturnUrl || '',
    alipayGateway: stored.alipayGateway || '',
    alipayPrivateKey: stored.alipayPrivateKeyEnc ? await decryptSecret(stored.alipayPrivateKeyEnc) : '',
    alipayPublicKey: stored.alipayPublicKeyEnc ? await decryptSecret(stored.alipayPublicKeyEnc) : '',
  };
}

// ==================== 测试连接 ====================

function classifyTestError(msg: string): { ok: boolean; message: string } | null {
  // 订单/交易不存在 → 表示已通过认证，凭据有效
  if (/订单号不存在|交易不存在|ORDER_NOT_EXIST|TRADE_NOT_EXIST|ACQ\.TRADE_NOT_EXIST|ORDER_PAID|order not exist/i.test(msg)) {
    return { ok: true, message: `连接成功：认证通过（测试订单不存在属正常现象）` };
  }
  // 签名/认证类错误 → 凭据无效
  if (/SIGN|签名|UNAUTHORIZED|401|认证失败|权限|NO_AUTH|KEY|证书|INVALID/i.test(msg)) {
    return { ok: false, message: `连接失败（认证/签名错误）：${msg}` };
  }
  return null;
}

async function testWechat(stored: StoredConfig | null): Promise<{ ok: boolean; message: string }> {
  const cfg = await buildDecryptedConfig(stored);
  if (!cfg || !cfg.wechatAppId || !cfg.wechatMchId || !cfg.wechatPrivateKey) {
    return { ok: false, message: '微信支付未完整配置（缺少 AppID / 商户号 / 商户私钥）' };
  }
  const wechatConfig: WechatPayConfig = {
    appId: cfg.wechatAppId,
    mchId: cfg.wechatMchId,
    apiV3Key: cfg.wechatApiV3Key,
    privateKey: cfg.wechatPrivateKey,
    certSerial: cfg.wechatCertSerial,
    notifyUrl: cfg.wechatNotifyUrl,
  };
  try {
    const testOrderNo = `TESTCONN${Date.now()}`;
    const result = await wechatQueryOrder(wechatConfig, testOrderNo);
    return { ok: true, message: `连接成功：已调用查询接口，返回状态 ${result.status || 'OK'}` };
  } catch (e: any) {
    const msg = String(e?.message || e);
    const cls = classifyTestError(msg);
    return cls || { ok: false, message: `连接失败：${msg}` };
  }
}

async function testAlipay(stored: StoredConfig | null): Promise<{ ok: boolean; message: string }> {
  const cfg = await buildDecryptedConfig(stored);
  if (!cfg || !cfg.alipayAppId || !cfg.alipayPrivateKey || !cfg.alipayPublicKey) {
    return { ok: false, message: '支付宝未完整配置（缺少 AppID / 商户私钥 / 支付宝公钥）' };
  }
  const alipayConfig: AlipayConfig = {
    appId: cfg.alipayAppId,
    privateKey: cfg.alipayPrivateKey,
    publicKey: cfg.alipayPublicKey,
    notifyUrl: cfg.alipayNotifyUrl,
    returnUrl: cfg.alipayReturnUrl,
    gateway: cfg.alipayGateway || 'https://openapi.alipay.com/gateway.do',
  };
  try {
    const testOrderNo = `TESTCONN${Date.now()}`;
    const result = await alipayQueryTrade(alipayConfig, testOrderNo);
    return { ok: true, message: `连接成功：已调用查询接口，返回状态 ${result.status || 'OK'}` };
  } catch (e: any) {
    const msg = String(e?.message || e);
    const cls = classifyTestError(msg);
    return cls || { ok: false, message: `连接失败：${msg}` };
  }
}

// ==================== API ====================

export async function GET(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const { data, updatedAt } = await loadStored();
    // 仅返回非敏感字段明文 + 敏感字段的"是否已配置"标记
    const result = {
      wechatAppId: data?.wechatAppId || '',
      wechatMchId: data?.wechatMchId || '',
      wechatApiV3Key: data?.wechatApiV3Key || '',
      wechatCertSerial: data?.wechatCertSerial || '',
      wechatNotifyUrl: data?.wechatNotifyUrl || '',
      alipayAppId: data?.alipayAppId || '',
      alipayNotifyUrl: data?.alipayNotifyUrl || '',
      alipayReturnUrl: data?.alipayReturnUrl || '',
      alipayGateway: data?.alipayGateway || 'https://openapi.alipay.com/gateway.do',
      wechatPrivateKeyConfigured: !!(data?.wechatPrivateKeyEnc),
      alipayPrivateKeyConfigured: !!(data?.alipayPrivateKeyEnc),
      alipayPublicKeyConfigured: !!(data?.alipayPublicKeyEnc),
      updatedAt,
    };
    return NextResponse.json({ config: result });
  } catch (error) {
    console.error('获取支付配置失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { allowed } = await requireAdmin(req);
    if (!allowed) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const body = await req.json();

    // 测试连接
    if (body?.action === 'test') {
      const { data } = await loadStored();
      if (body.target === 'wechat') {
        const r = await testWechat(data);
        return NextResponse.json(r);
      }
      if (body.target === 'alipay') {
        const r = await testAlipay(data);
        return NextResponse.json(r);
      }
      return NextResponse.json({ ok: false, message: '未知的测试目标' }, { status: 400 });
    }

    // 保存配置
    const { data: existing } = await loadStored();
    const stored: StoredConfig = {
      wechatAppId: body.wechatAppId ?? existing?.wechatAppId ?? '',
      wechatMchId: body.wechatMchId ?? existing?.wechatMchId ?? '',
      wechatApiV3Key: body.wechatApiV3Key ?? existing?.wechatApiV3Key ?? '',
      wechatCertSerial: body.wechatCertSerial ?? existing?.wechatCertSerial ?? '',
      wechatNotifyUrl: body.wechatNotifyUrl ?? existing?.wechatNotifyUrl ?? '',
      alipayAppId: body.alipayAppId ?? existing?.alipayAppId ?? '',
      alipayNotifyUrl: body.alipayNotifyUrl ?? existing?.alipayNotifyUrl ?? '',
      alipayReturnUrl: body.alipayReturnUrl ?? existing?.alipayReturnUrl ?? '',
      alipayGateway: body.alipayGateway ?? existing?.alipayGateway ?? 'https://openapi.alipay.com/gateway.do',
      // 敏感字段：仅在提交非空值时更新；否则保留原加密值
      wechatPrivateKeyEnc:
        typeof body.wechatPrivateKey === 'string' && body.wechatPrivateKey.trim()
          ? await encryptSecret(body.wechatPrivateKey)
          : existing?.wechatPrivateKeyEnc || '',
      alipayPrivateKeyEnc:
        typeof body.alipayPrivateKey === 'string' && body.alipayPrivateKey.trim()
          ? await encryptSecret(body.alipayPrivateKey)
          : existing?.alipayPrivateKeyEnc || '',
      alipayPublicKeyEnc:
        typeof body.alipayPublicKey === 'string' && body.alipayPublicKey.trim()
          ? await encryptSecret(body.alipayPublicKey)
          : existing?.alipayPublicKeyEnc || '',
    };

    await saveStored(stored);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存支付配置失败:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
