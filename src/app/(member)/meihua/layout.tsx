import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '梅花易数',
  description: '以数起卦，以象断事，梅花易数随心占断，洞悉事物发展轨迹。',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
