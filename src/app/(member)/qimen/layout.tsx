import type { Metadata } from 'next';
import { getBrandName } from '@/lib/brand';
import ToolSeoContent from '@/components/seo/ToolSeoContent';

export const revalidate = 60; // 品牌名等动态元数据定期重新生成（ISR）
export async function generateMetadata(): Promise<Metadata> {
  const brandName = await getBrandName();
  return {
  title: '奇门遁甲在线排盘 - 时家奇门预测',
  description: '奇门遁甲在线排盘，时家奇门自动布局九宫、八门、九星、八神，用于择时趋吉避凶，为重要决策提供传统术数参考。',
  keywords: ['奇门遁甲', '奇门遁甲排盘', '时家奇门', '九宫八门', '择吉', '预测', '遁甲', '术数'],
  alternates: {
    canonical: 'https://ming8.online/qimen',
  },
  openGraph: {
    title: '奇门遁甲在线排盘 - 时家奇门预测',
    description: '时家奇门自动布局九宫八门九星八神，择时趋吉避凶。',
    type: 'website',
    locale: 'zh_CN',
    siteName: brandName,
    url: 'https://ming8.online/qimen',
  },
  };
}

const INTRO = [
  '奇门遁甲被誉为"帝王之学"，与太乙神数、大六壬并称中国古代"三式"，是传统术数中格局最完备、信息量最大的预测体系之一。它以洛书九宫为框架，融合八门、九星、八神与天干布局，用于择时、趋吉避凶与重大决策参考。',
  '知微阁奇门遁甲排盘采用时家奇门起局方式，自动完成置闰与符头推算：选择日期时间即可生成完整奇门盘，清晰呈现九宫格局、值符值使、八门八神分布，无需了解复杂的起局规则。',
  '排盘结果支持用神定位分析，可结合所问之事查看相应宫位的门星神组合，判断事态发展的有利时机与方位，让千年帝王之术走进日常决策。',
];

const FAQS = [
  {
    q: '什么是奇门遁甲？',
    a: '奇门遁甲是中国古代术数"三式"之一，以洛书九宫为框架，结合八门、九星、八神与天干布局，用于预测事态、选择时机与方位，古称帝王之学。',
  },
  {
    q: '奇门遁甲排盘看什么？',
    a: '重点看值符值使落宫、八门旺衰、用神宫位的门星神组合与格局吉凶，判断所问之事的发展趋势与有利时机。',
  },
  {
    q: '奇门遁甲排盘需要什么信息？',
    a: '选择要占问的日期与时辰即可排时家奇门盘，系统自动完成起局布局，无需手动推算。',
  },
  {
    q: '奇门遁甲和八字有什么区别？',
    a: '八字论人生命局的整体趋势，奇门遁甲重具体时空下"一事一断"的吉凶决策；一管"命"，一管"事"，用途相辅相成。',
  },
  {
    q: '奇门遁甲中的八门分别代表什么？',
    a: '八门指休门、生门、伤门、杜门、景门、死门、惊门、开门，各代表不同的事物属性。其中开、休、生为三吉门，适合办事、出行、求财；死、惊、伤为三凶门，宜静不宜动。',
  },
  {
    q: '奇门遁甲九星有哪些？',
    a: '九星包括天蓬、天芮、天冲、天辅、天禽、天心、天柱、天任、天英，每颗星有特定的吉凶属性和象征意义。天辅星主文教，天心星主医疗，天任星主稳定，选择吉星落宫方位做事更有利。',
  },
  {
    q: '奇门遁甲中的八神有什么用？',
    a: '八神包括值符、腾蛇、太阴、六合、白虎、玄武、九地、九天，代表不同时空能量状态。八神对门星组合起修饰和增强作用，判断时需结合八神特性综合分-析。',
  },
  {
    q: '奇门遁甲择日择时怎么用？',
    a: '选择日期时辰排盘，查看用神宫位的吉凶格局，优先选择开休生三吉门所在宫位对应的时辰，同时避开五不遇时、三奇入墓等不利格局，用于出行、签约、开业等重大决策的时机选择。',
  },
  {
    q: '时家奇门和日家奇门有什么区别？',
    a: '奇门遁甲按时辰起局称为时家奇门，按日起局称为日家奇门。时家奇门最常用，精度最高，适合具体事务的占断；日家奇门相对简化，适合日常参考。本站采用时家奇门起局方式。',
  },
  {
    q: '奇门遁甲排盘免费吗？',
    a: '知微阁奇门遁甲排盘完全免费使用，输入日期时间即可生成完整奇门盘，包含九宫格局、门星神分布、值符值使信息，无需付费即可使用全部功能。',
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8 py-12">
      <main className="min-w-0">{children}</main>
      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <ToolSeoContent
            toolName="奇门遁甲排盘"
            toolPath="/qimen"
            introParagraphs={INTRO}
            faqs={FAQS}
            relatedCategory="qimen"
            variant="sidebar"
            relatedTools={[
              { name: '四柱八字排盘', path: '/bazi', icon: '☰', desc: '免费生辰八字四柱排盘' },
              { name: '紫微斗数排盘', path: '/ziwei', icon: '★', desc: '免费紫微命盘查询' },
              { name: '梅花易数起卦', path: '/meihua', icon: '✿', desc: '免费占卜解卦' },
            ]}
          />
        </div>
      </aside>
    </div>
  );
}
