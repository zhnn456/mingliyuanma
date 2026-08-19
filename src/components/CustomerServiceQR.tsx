'use client';

import { useState, useEffect } from 'react';

/**
 * 客服二维码组件 — 在充值/支付相关页面右侧展示
 * 引导用户扫码添加客服微信进行充值和咨询
 *
 * 二维码、标题、联系方式均从 /api/config/customer-service 动态读取，
 * 可在管理后台「会员等级」页底部「客服配置」区修改。
 */
interface CustomerServiceConfig {
  contact: string;
  contactType: string;
  contactLabel: string;
  qrUrl: string;
  qrTitle: string;
  qrSubtitle: string;
}

const FALLBACK_CONFIG: CustomerServiceConfig = {
  contact: 'Xcbot2026',
  contactType: 'wechat',
  contactLabel: '微信',
  qrUrl: '/images/qr-customer-service.jpg',
  qrTitle: '扫码添加客服',
  qrSubtitle: '微信 / 支付宝均可扫码',
};

export default function CustomerServiceQR() {
  const [cfg, setCfg] = useState<CustomerServiceConfig>(FALLBACK_CONFIG);

  useEffect(() => {
    let mounted = true;
    fetch('/api/config/customer-service')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (mounted && d) setCfg(d);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="hidden lg:block w-60 flex-shrink-0">
      <div className="sticky top-24">
        <div className="bg-white rounded-xl border border-stone-200 p-5 text-center shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">{cfg.qrTitle}</h3>
          {/* 二维码 - 原始尺寸 888×1131，按比例完整展示 */}
          <div
            className="w-full max-w-[200px] mx-auto mb-4 rounded-xl overflow-hidden border-2 border-stone-100 bg-white"
            style={{ aspectRatio: '888 / 1131' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cfg.qrUrl}
              alt="客服二维码"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xs text-gray-500 mb-3">{cfg.qrSubtitle}</p>
          <div className="border-t border-stone-100 pt-3">
            <p className="text-xs text-gray-600 font-medium">充值 · 购买卡密 · 咨询</p>
            <p className="text-xs text-gray-400 mt-1">
              {cfg.contactLabel}：{cfg.contact}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
