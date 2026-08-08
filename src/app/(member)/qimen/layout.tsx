import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '奇门遁甲排盘',
  description: '时家奇门排盘，观天时地利，断吉凶休咎，传承千年奇门智慧。',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
