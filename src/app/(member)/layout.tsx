import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '个人中心',
};

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
