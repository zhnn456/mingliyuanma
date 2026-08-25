import type { Metadata } from 'next';
import { getBrandName } from '@/lib/brand';
import ToolSeoContent from '@/components/seo/ToolSeoContent';

export const revalidate = 60; // 品牌名等动态元数据定期重新生成（ISR）
export async function generateMetadata(): Promise<Metadata> {
  const brandName = await getBrandName();
  return {
  title: '梅花易数在线起卦 - 免费占卜解卦',
  description: '梅花易数在线起卦，支持时间起卦与数字起卦，体用生克断吉凶，随心动念即刻占卜事物发展走向，传统占卜与现代便捷体验结合。',
  keywords: ['梅花易数', '在线起卦', '梅花易数起卦', '占卜', '解卦', '体用生克', '八卦', '邵雍'],
  alternates: {
    canonical: 'https://ming8.online/meihua',
  },
  openGraph: {
    title: '梅花易数在线起卦 - 免费占卜解卦',
    description: '梅花易数在线起卦，支持时间与数字起卦，体用生克断吉凶。',
    type: 'website',
    locale: 'zh_CN',
    siteName: brandName,
    url: 'https://ming8.online/meihua',
  },
  };
}

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
  {
    q: '梅花易数中的体用生克是什么？',
    a: '体卦代表问卦者自身，用卦代表所问之事。体生用为泄气、用生体为吉、体克用为费力、用克体为凶。体用关系是梅花易数判断吉凶的核心方法。',
  },
  {
    q: '梅花易数本卦、互卦、变卦分别代表什么？',
    a: '本卦代表事物初始状态，互卦代表发展过程，变卦代表最终结果。三卦结合体用生克关系，可以判断事物从开始到结束的完整发展脉络。',
  },
  {
    q: '梅花易数用数字怎么起卦？',
    a: '任意取两个数字，第一个数字除8取余数得上卦，第二个数字除8取余数得下卦，两数之和除6取余数得动爻。例如数字3和8，3为离卦（上卦），8为坤卦（下卦），和为11除6余5，五爻动。',
  },
  {
    q: '梅花易数中的八卦万物类象是什么？',
    a: '八卦（乾兑离震巽坎艮坤）各代表一类事物，如乾为天、为父、为领导，坤为地、为母、为包容。起卦后结合卦象的万物类象解读，可以获取更丰富的占断信息。',
  },
  {
    q: '梅花易数适合占卜哪些事情？',
    a: '梅花易数可用于占卜事业、财运、感情、出行、考试、健康等各类事务，尤其适合"心念一动"时的即时占卜，讲究自然感应，不需要繁复的仪式。',
  },
  {
    q: '梅花易数起卦免费吗？',
    a: '知微阁梅花易数起卦完全免费，支持时间起卦和数字起卦两种方式，一键生成体用生克分析和吉凶判断，无需注册即可使用。',
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-8 py-12">
      <main className="min-w-0">{children}</main>
      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <ToolSeoContent
            toolName="梅花易数起卦"
            toolPath="/meihua"
            introParagraphs={INTRO}
            faqs={FAQS}
            relatedCategory="meihua"
            variant="sidebar"
            relatedTools={[
              { name: '四柱八字排盘', path: '/bazi', icon: '☰', desc: '免费生辰八字四柱排盘' },
              { name: '紫微斗数排盘', path: '/ziwei', icon: '★', desc: '免费紫微命盘查询' },
              { name: '奇门遁甲排盘', path: '/qimen', icon: '◈', desc: '时家奇门预测' },
            ]}
          />
        </div>
      </aside>
    </div>
  );
}
