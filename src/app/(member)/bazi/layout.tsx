import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '四柱八字排盘',
  description: '专业四柱八字排盘，输入出生信息即时生成八字命盘，解析五行强弱与大运流年。',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
