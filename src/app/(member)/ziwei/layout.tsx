import type { Metadata } from 'next';
import { getBrandName } from '@/lib/brand';
import ToolSeoContent from '@/components/seo/ToolSeoContent';

export const revalidate = 60; // 品牌名等动态元数据定期重新生成（ISR）
export async function generateMetadata(): Promise<Metadata> {
  const brandName = await getBrandName();
  return {
  title: '紫微斗数在线排盘 - 免费紫微命盘查询',
  description: '紫微斗数在线排盘，免费安布十二宫星曜命盘，解析命宫主星与四化格局，助你了解性格、事业、财运与婚姻运势。',
  keywords: ['紫微斗数', '紫微斗数排盘', '紫微命盘', '在线排盘', '十二宫', '星曜', '四化', '命理'],
  alternates: {
    canonical: 'https://ming8.online/ziwei',
  },
  openGraph: {
    title: '紫微斗数在线排盘 - 免费紫微命盘查询',
    description: '免费紫微斗数排盘，安布十二宫星曜命盘，解析命宫主星与四化格局。',
    type: 'website',
    locale: 'zh_CN',
    siteName: brandName,
    url: 'https://ming8.online/ziwei',
  },
  };
}

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
  {
    q: '紫微斗数十二宫分别代表什么？',
    a: '十二宫包括命宫、兄弟宫、夫妻宫、子女宫、财帛宫、疾厄宫、迁移宫、交友宫、官禄宫、田宅宫、福德宫、父母宫，每宫对应一个人生领域，宫位内星曜组合反映该领域的吉凶状况。',
  },
  {
    q: '紫微斗数中的十四主星有哪些？',
    a: '十四主星分为紫微星系（紫微、天机、太阳、武曲、天同、廉贞）和天府星系（天府、太阴、贪狼、巨门、天相、天梁、七杀、破军），每颗主星落入不同宫位产生不同的性格特质与运势表现。',
  },
  {
    q: '紫微斗数四化飞星是什么意思？',
    a: '四化指化禄、化权、化科、化忌，是星曜的四种能量变化。化禄主财运与人缘，化权主权力与掌控，化科主名声与考试，化忌主困扰与阻碍。四化位置对命盘解读有重要影响。',
  },
  {
    q: '紫微斗数命宫空宫怎么办？',
    a: '命宫无主星称为空宫，需借对宫（迁移宫）的星曜来看。空宫不代表命不好，反而弹性较大，受大限影响明显，后期发展潜力往往不错。',
  },
  {
    q: '紫微斗数中的大限怎么看？',
    a: '大限是紫微斗数中按十年划分的运势周期，阳男阴女顺行、阴男阳女逆行。排盘结果中会标注每个大限的年龄区间与宫位，帮助了解不同人生阶段的运势重点。',
  },
  {
    q: '紫微斗数免费排盘和软件排盘结果一样吗？',
    a: '知微阁紫微斗数排盘严格遵循传统安星规则，与专业排盘软件结果一致。免费即可生成完整命盘，包含十二宫安布、主星辅星排列、四化飞星位置，无需付费购买专业软件。',
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
            relatedTools={[
              { name: '四柱八字排盘', path: '/bazi', icon: '☰', desc: '免费生辰八字四柱排盘' },
              { name: '奇门遁甲排盘', path: '/qimen', icon: '◈', desc: '时家奇门预测' },
              { name: '梅花易数起卦', path: '/meihua', icon: '✿', desc: '免费占卜解卦' },
            ]}
          />
        </div>
      </aside>
    </div>
  );
}
