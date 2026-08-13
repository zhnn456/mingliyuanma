import type { Metadata } from 'next';
import ToolSeoContent from '@/components/seo/ToolSeoContent';

export const metadata: Metadata = {
  title: '八字排盘在线 - 免费生辰八字四柱排盘',
  description: '免费八字排盘，输入出生信息即刻生成生辰八字四柱命盘，解析五行旺衰、喜用神与大运流年，命理入门必备工具。',
  keywords: ['八字排盘', '生辰八字', '四柱排盘', '免费八字排盘', '五行', '大运流年', '喜用神', '命理'],
  alternates: {
    canonical: 'https://ming8.online/bazi',
  },
  openGraph: {
    title: '八字排盘在线 - 免费生辰八字四柱排盘 - 知微阁',
    description: '免费八字排盘，生成生辰八字四柱命盘，解析五行旺衰、喜用神与大运流年。',
    type: 'website',
    locale: 'zh_CN',
    siteName: '知微阁',
    url: 'https://ming8.online/bazi',
  },
};

const INTRO = [
  '八字排盘（又称生辰八字、四柱排盘）是中国传统命理学中最核心的方法之一。它以出生年、月、日、时对应的天干地支，构成年柱、月柱、日柱、时柱共四柱八字，再通过五行生克、十神配置与大运流年，分析一个人的性格特质与运势走向。',
  '知微阁八字排盘严格依据节气与万年历推算，自动校正时区影响，支持公历与农历出生日期输入。输入出生信息后即刻生成完整命盘，包含四柱干支、十神分布、五行旺衰统计，并支持查看大运流年走势。',
  '排盘结果提供从入门到专业的递进解读：五行强弱一目了然，喜用神取用有据可依；进阶分析覆盖事业、财运、婚姻、健康等人生维度，帮助你将千年命理智慧应用于现代生活。',
];

const FAQS = [
  {
    q: '什么是八字排盘？',
    a: '八字排盘又称四柱排盘，根据出生年、月、日、时转换为天干地支，形成年柱、月柱、日柱、时柱共八个字，用于分析命局的五行分布与整体运势。',
  },
  {
    q: '八字排盘需要提供哪些信息？',
    a: '只需提供出生年月日时与性别即可，公历、农历日期均可输入，系统会自动换算节气与干支，无需手动查万年历。',
  },
  {
    q: '八字排盘准不准？',
    a: '排盘本身是严格的历法计算，准确性有保障；命理解读属于传统文化视角的参考分析，建议理性看待，将其作为认识自我的一种参考。',
  },
  {
    q: '八字里五行缺什么怎么看？',
    a: '排盘结果会列出四柱干支的五行分布与旺衰统计，若某个五行缺失（如缺水），代表命局中该五行能量偏弱，可在喜用神分析中查看对应的平衡建议。',
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8 py-12">
      <main className="min-w-0">{children}</main>
      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <ToolSeoContent
            toolName="四柱八字排盘"
            toolPath="/bazi"
            introParagraphs={INTRO}
            faqs={FAQS}
            relatedCategory="bazi"
            variant="sidebar"
          />
        </div>
      </aside>
    </div>
  );
}
