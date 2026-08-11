import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '传统文化学堂',
  description:
    '传承千年智慧，从入门到精通。阴阳五行、天干地支、二十四节气、传统历法等文化知识图解与讲解。',
};

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
