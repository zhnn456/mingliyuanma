import type { Metadata } from 'next';
import AgentLayoutClient from './layout-client';

export const metadata: Metadata = {
  title: '代理商后台',
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <AgentLayoutClient>{children}</AgentLayoutClient>;
}
