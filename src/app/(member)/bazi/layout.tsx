import type { Metadata } from 'next';
import { getBrandName } from '@/lib/brand';
import ToolSeoContent from '@/components/seo/ToolSeoContent';

export const revalidate = 60; // 品牌名等动态元数据定期重新生成（ISR）
export async function generateMetadata(): Promise<Metadata> {
  const brandName = await getBrandName();
  return {
  title: '八字排盘在线 - 免费生辰八字四柱排盘',
  description: '免费八字排盘，输入出生信息即刻生成生辰八字四柱命盘，解析五行旺衰、喜用神与大运流年，命理入门必备工具。',
  keywords: ['八字排盘', '生辰八字', '四柱排盘', '免费八字排盘', '五行', '大运流年', '喜用神', '命理'],
  alternates: {
    canonical: 'https://ming8.online/bazi',
  },
  openGraph: {
    title: '八字排盘在线 - 免费生辰八字四柱排盘',
    description: '免费八字排盘，生成生辰八字四柱命盘，解析五行旺衰、喜用神与大运流年。',
    type: 'website',
    locale: 'zh_CN',
    siteName: brandName,
    url: 'https://ming8.online/bazi',
  },
  };
}

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
  {
    q: '生辰八字是哪八个字？',
    a: '生辰八字由年柱、月柱、日柱、时柱各两个天干地支组成，共八个字。例如甲子年、丙寅月、戊午日、庚申时，分别代表出生年、月、日、时的干支信息。',
  },
  {
    q: '八字排盘中的大运是什么意思？',
    a: '大运是八字命理中十年一换的运势周期，起运时间根据出生日与节气距离计算。排盘结果会列出每一步大运的干支与起止年龄，帮助了解人生各阶段的运势变化。',
  },
  {
    q: '八字中的喜用神是什么？',
    a: '喜用神是根据八字五行平衡分析得出的、对命局最有利的五行元素。取准喜用神是八字分析的核心，可为职业选择、发展方向、生活方式等提供参考。',
  },
  {
    q: '八字排盘和紫微斗数有什么区别？',
    a: '八字侧重五行生克与十神关系，以日干为核心分析命局；紫微斗数以命宫为核心，结合十二宫位与星曜分布判断运势。两者视角不同，可互为印证，建议两者都排盘对比参考。',
  },
  {
    q: '免费八字排盘和付费的有区别吗？',
    a: '知微阁的免费八字排盘在排盘计算上与付费工具完全一致，均严格按节气历法推算。区别在于免费版提供基础解读与五行分析，适合日常参考使用。',
  },
  {
    q: '八字排盘怎么看婚姻和财运？',
    a: '八字中看婚姻主要看日支（夫妻宫）与配偶星的状态；看财运则关注财星在命局中的旺衰与位置，结合大运流年判断财运走势。排盘结果中会涵盖这些维度的分析。',
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
            relatedTools={[
              { name: '紫微斗数排盘', path: '/ziwei', icon: '★', desc: '免费紫微命盘查询' },
              { name: '奇门遁甲排盘', path: '/qimen', icon: '◈', desc: '时家奇门预测' },
              { name: '梅花易数起卦', path: '/meihua', icon: '✿', desc: '免费占卜解卦' },
            ]}
          />
        </div>
      </aside>
    </div>
  );
}
