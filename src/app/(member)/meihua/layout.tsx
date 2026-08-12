import type { Metadata } from 'next';
import ToolSeoContent from '@/components/seo/ToolSeoContent';

export const metadata: Metadata = {
  title: '梅花易数在线起卦 - 免费占卜解卦',
  description: '梅花易数在线起卦，支持时间起卦与数字起卦，体用生克断吉凶，随心动念即刻占卜事物发展走向，传统占卜与现代便捷体验结合。',
  keywords: ['梅花易数', '在线起卦', '梅花易数起卦', '占卜', '解卦', '体用生克', '八卦', '邵雍'],
  alternates: {
    canonical: 'https://ming8.online/meihua',
  },
  openGraph: {
    title: '梅花易数在线起卦 - 免费占卜解卦 - 知微阁',
    description: '梅花易数在线起卦，支持时间与数字起卦，体用生克断吉凶。',
    type: 'website',
    locale: 'zh_CN',
    siteName: '知微阁',
    url: 'https://ming8.online/meihua',
  },
};

const INTRO = [
  '梅花易数由北宋理学家邵雍（邵康节）所创，以"万物皆数"为核心思想，任意数字、时间、物象皆可起卦，取象灵活、断事灵动，是传统占卜中最为便捷的方法之一。',
  '知微阁梅花易数支持时间起卦与数字起卦两种方式：选择当前时间或输入心中所想的数字，系统立即依据先天八卦数起卦，生成本卦、互卦、变卦，并基于体用生克关系给出吉凶判断。',
  '从观梅占到日常决策，梅花易数讲究"心念一动、卦象自成"。起卦后可结合八卦万物类象理解卦意，参考体用生克解读事物发展的过程与结果。',
];

const FAQS = [
  {
    q: '什么是梅花易数？',
    a: '梅花易数是北宋邵雍创立的占卜方法，以数字起卦、八卦取象，结合体用生克关系判断事物发展，因"观梅占"典故得名。',
  },
  {
    q: '梅花易数怎么起卦？',
    a: '可用任意数字、时间或物象起卦：数字除8得上下卦、除6得动爻；时间起卦以年、月、日、时之数求和取卦，本工具一键即可完成。',
  },
  {
    q: '梅花易数和六爻有什么区别？',
    a: '六爻以铜钱摇卦、侧重卦爻辞与世应关系；梅花易数"数由心生"、起卦灵活，更重体用生克与卦象取意，两者体系与侧重不同。',
  },
  {
    q: '梅花易数准吗？',
    a: '起卦机制严谨、取象断事有章法可循，占断结果可作为决策参考；传统占卜讲究"诚则灵"，建议以理性平和的心态看待结果。',
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToolSeoContent
        toolName="梅花易数起卦"
        toolPath="/meihua"
        introParagraphs={INTRO}
        faqs={FAQS}
        relatedCategory="meihua"
      />
    </>
  );
}
