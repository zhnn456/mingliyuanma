import type { Metadata } from 'next';
import ToolSeoContent from '@/components/seo/ToolSeoContent';

export const metadata: Metadata = {
  title: '紫微斗数在线排盘 - 免费紫微命盘查询',
  description: '紫微斗数在线排盘，免费安布十二宫星曜命盘，解析命宫主星与四化格局，助你了解性格、事业、财运与婚姻运势。',
  keywords: ['紫微斗数', '紫微斗数排盘', '紫微命盘', '在线排盘', '十二宫', '星曜', '四化', '命理'],
  alternates: {
    canonical: 'https://ming8.online/ziwei',
  },
  openGraph: {
    title: '紫微斗数在线排盘 - 免费紫微命盘查询 - 知微阁',
    description: '免费紫微斗数排盘，安布十二宫星曜命盘，解析命宫主星与四化格局。',
    type: 'website',
    locale: 'zh_CN',
    siteName: '知微阁',
    url: 'https://ming8.online/ziwei',
  },
};

const INTRO = [
  '紫微斗数位列中国"五大神数"之首，以出生年、月、日、时为依据，安布命宫、财帛宫、官禄宫、夫妻宫等十二宫位，并结合一百余颗星曜的分布与组合，勾勒一个人的性格底色与人生格局。',
  '知微阁紫微斗数排盘自动完成起盘定局，无需手动查表：输入出生信息即可生成完整命盘，包含十二宫安布、主星辅星排列、四化飞星位置，清晰呈现命盘全貌。',
  '命盘生成后，可依次解读命宫主星的性格基调、财帛宫与官禄宫的事业财运线索、夫妻宫的感情走向，并通过大限小限的推移了解不同人生阶段的运势重点。',
];

const FAQS = [
  {
    q: '什么是紫微斗数？',
    a: '紫微斗数是中国传统命理学的重要流派，以命宫为核心，结合十二宫位与星曜组合，推断性格、事业、财运、婚姻等人生面向，位列五大神数之首。',
  },
  {
    q: '紫微斗数和八字有什么区别？',
    a: '八字侧重五行平衡与喜用神，紫微斗数侧重宫位体系与星曜格局；八字论"命"，紫微斗数兼看"命"与"运"，两者视角互补，可互为印证。',
  },
  {
    q: '紫微斗数排盘需要什么信息？',
    a: '只需出生年月日时与性别，系统自动定盘安星，无需手动推算宫位与星曜位置。',
  },
  {
    q: '怎么看紫微斗数命盘？',
    a: '先看命宫主星确定性格基调，再看财帛宫、官禄宫、夫妻宫等对应人生领域，辅以四化飞星判断吉凶变化与流年走向。',
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8 py-12">
      <main className="min-w-0">{children}</main>
      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <ToolSeoContent
            toolName="紫微斗数排盘"
            toolPath="/ziwei"
            introParagraphs={INTRO}
            faqs={FAQS}
            relatedCategory="ziwei"
            variant="sidebar"
          />
        </div>
      </aside>
    </div>
  );
}
