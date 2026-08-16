import type { Metadata } from 'next';
import { getBrandName } from '@/lib/brand';

export const revalidate = 60; // 品牌名等动态元数据定期重新生成（ISR）

export async function generateMetadata(): Promise<Metadata> {
  const brandName = await getBrandName();
  return {
    title: `传统文化学堂 - ${brandName}`,
    description:
      '传承千年智慧，从入门到精通。阴阳五行、天干地支、二十四节气、传统历法等文化知识图解与讲解。',
  };
}

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
