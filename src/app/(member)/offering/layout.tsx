import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '在线祈福',
  description: '民俗祈福文化展示，在线献花、点灯、供水、燃香，寄托美好心愿。',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
