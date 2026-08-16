import type { Metadata } from 'next';
import PartnerPage from './partner-client';

export const metadata: Metadata = {
  title: '创业合作 - 知微阁 · 低成本创业·快速部署·即时赚钱',
  description:
    '知微阁创业合作计划：源码部署一次买断独立运营、无限 SaaS 开户、单独 SaaS 开户，0 元开户、99 元/月起，客户充值即分润，最高 60% 分润比例。八字、紫微斗数、奇门遁甲、梅花易数完整平台，一键部署当天上线。',
  keywords: [
    '知微阁创业合作', '源码部署', 'SaaS代理', '无限SaaS开户', '低成本创业',
    '命理平台源码', '八字源码', '紫微斗数源码', '网赚项目', '副业创业',
  ],
  alternates: {
    canonical: 'https://ming8.online/partner',
  },
  openGraph: {
    title: '创业合作 - 知微阁：低成本创业 · 快速部署 · 即时赚钱',
    description:
      '源码部署独立运营，100% 收益归己；或单独 SaaS 开户，0 元试用、99 元/月起，最高 60% 分润。',
    type: 'website',
    locale: 'zh_CN',
    siteName: '知微阁',
    url: 'https://ming8.online/partner',
  },
};

export default function Partner() {
  return <PartnerPage />;
}
