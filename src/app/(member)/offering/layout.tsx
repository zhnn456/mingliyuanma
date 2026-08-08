import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '在线供奉',
  description: '虔诚供奉佛菩萨，积累功德资粮，在线供灯、供花、供水、供香。',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
