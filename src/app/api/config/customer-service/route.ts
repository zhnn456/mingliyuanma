/**
 * 客服配置公开API（无需鉴权）
 *
 * 统一返回客服联系方式 + 客服二维码配置，供支付页/支付结果页/会员页使用。
 * 配置项存储于 SiteConfig 表，可在管理后台「会员等级」页底部「客服配置」区修改。
 *
 * 配置键：
 *   customer_service_contact       - 客服联系方式（微信号/手机号/QQ/邮箱等）
 *   customer_service_contact_type  - 联系方式类型：wechat | phone | qq | email | other
 *   customer_service_qr_url        - 客服二维码图片URL（留空则使用默认本地图片）
 *   customer_service_qr_title      - 二维码上方标题
 *   customer_service_qr_subtitle   - 二维码下方副标题
 */
import { NextResponse } from 'next/server';
import { queryFirst } from '@/lib/d1';

const CONFIG_KEYS = {
  contact: 'customer_service_contact',
  contactType: 'customer_service_contact_type',
  qrUrl: 'customer_service_qr_url',
  qrTitle: 'customer_service_qr_title',
  qrSubtitle: 'customer_service_qr_subtitle',
} as const;

const DEFAULTS = {
  contact: 'Xcbot2026',
  contactType: 'wechat',
  qrUrl: '/images/qr-customer-service.jpg',
  qrTitle: '扫码添加客服',
  qrSubtitle: '微信 / 支付宝均可扫码',
} as const;

// 联系方式类型 -> 中文标签
const CONTACT_TYPE_LABELS: Record<string, string> = {
  wechat: '微信',
  phone: '手机',
  qq: 'QQ',
  email: '邮箱',
  other: '客服',
};

export async function GET() {
  try {
    const result: Record<string, string> = {};
    for (const [field, key] of Object.entries(CONFIG_KEYS)) {
      const row = (await queryFirst('SELECT value FROM SiteConfig WHERE `key` = ?', key)) as any;
      result[field] = row?.value?.trim() || '';
    }
    const contactType = result.contactType || DEFAULTS.contactType;
    return NextResponse.json({
      contact: result.contact || DEFAULTS.contact,
      contactType,
      contactLabel: CONTACT_TYPE_LABELS[contactType] || '客服',
      qrUrl: result.qrUrl || DEFAULTS.qrUrl,
      qrTitle: result.qrTitle || DEFAULTS.qrTitle,
      qrSubtitle: result.qrSubtitle || DEFAULTS.qrSubtitle,
    });
  } catch (error) {
    console.error('获取客服配置失败:', error);
    return NextResponse.json({
      ...DEFAULTS,
      contactLabel: CONTACT_TYPE_LABELS[DEFAULTS.contactType],
    });
  }
}
