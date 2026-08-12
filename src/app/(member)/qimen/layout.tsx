import type { Metadata } from 'next';
import ToolSeoContent from '@/components/seo/ToolSeoContent';

export const metadata: Metadata = {
  title: '奇门遁甲在线排盘 - 时家奇门预测',
  description: '奇门遁甲在线排盘，时家奇门自动布局九宫、八门、九星、八神，用于择时趋吉避凶，为重要决策提供传统术数参考。',
  keywords: ['奇门遁甲', '奇门遁甲排盘', '时家奇门', '九宫八门', '择吉', '预测', '遁甲', '术数'],
  alternates: {
    canonical: 'https://ming8.online/qimen',
  },
  openGraph: {
    title: '奇门遁甲在线排盘 - 时家奇门预测 - 知微阁',
    description: '时家奇门自动布局九宫八门九星八神，择时趋吉避凶。',
    type: 'website',
    locale: 'zh_CN',
    siteName: '知微阁',
    url: 'https://ming8.online/qimen',
  },
};

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
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToolSeoContent
        toolName="奇门遁甲排盘"
        toolPath="/qimen"
        introParagraphs={INTRO}
        faqs={FAQS}
        relatedCategory="qimen"
      />
    </>
  );
}
