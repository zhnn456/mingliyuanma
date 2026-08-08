import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '紫微斗数排盘',
  description: '紫微斗数排盘，位列五大神数之首，解析十二宫位与星曜格局。',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
