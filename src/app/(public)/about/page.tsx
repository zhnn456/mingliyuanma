import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '关于我们 - 命理网',
  description: '命理网致力于传承中华传统命理文化，融合现代科技，提供专业、精准的四柱八字、紫微斗数、奇门遁甲、梅花易数等命理测算服务。',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-12">
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 页面标题 */}
        <div className="page-header">
          <div className="section-label justify-center">ABOUT US</div>
          <h1 className="page-header-title">
            <span>关于命理网</span>
          </h1>
          <p className="page-header-subtitle">传承千年智慧 · 融合现代科技</p>
        </div>

        {/* 品牌故事 */}
        <div className="card mb-8">
          <h2 className="card-title">品牌故事</h2>
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              命理网成立于2024年，是一群热爱中国传统文化的技术团队和命理学研究者共同打造的在线测算平台。
              我们坚信，千年传承的命理智慧不应仅存于古籍之中，而应该借助现代科技的力量，让更多人了解、学习和受益。
            </p>
            <p>
              我们的团队汇集了资深命理研究者、算法工程师和UI设计师，致力于将传统的四柱八字、紫微斗数、
              奇门遁甲、梅花易数等命理体系，以严谨的算法和优雅的界面呈现给用户。
            </p>
          </div>
        </div>

        {/* 我们的优势 */}
        <div className="card mb-8">
          <h2 className="card-title">我们的优势</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: '📚',
                title: '传承经典',
                description: '严格遵循《三命通会》《紫微斗数全书》《遁甲演义》《梅花易数》等经典典籍，算法有据可查。',
              },
              {
                icon: '⚡',
                title: '即时计算',
                description: '采用高性能计算引擎，毫秒级完成排盘，让您即时获取准确的命理分析结果。',
              },
              {
                icon: '🔒',
                title: '隐私保护',
                description: '您的个人信息和排盘记录采用加密存储，严格保护隐私安全，绝不泄露给第三方。',
              },
              {
                icon: '💡',
                title: '持续更新',
                description: '我们持续优化算法模型，扩展知识库内容，为用户提供越来越精准的命理解读。',
              },
            ].map((item) => (
              <div key={item.title} className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 服务介绍 */}
        <div className="card mb-8">
          <h2 className="card-title">服务介绍</h2>
          <div className="space-y-6">
            {[
              {
                icon: '🏛️',
                title: '四柱八字',
                desc: '基于出生年月日时推算四柱八字，分析五行旺衰、十神关系，解读命运密码。提供日主性格分析、大运流年推演、喜用神建议等全面解读。',
                href: '/bazi',
              },
              {
                icon: '⭐',
                title: '紫微斗数',
                desc: '排列十二宫位星曜分布，揭示命宫、财帛、官禄、夫妻等各宫位的主星辅星影响。提供星曜详解、四化飞星分析、命盘综合解读。',
                href: '/ziwei',
              },
              {
                icon: '🔮',
                title: '奇门遁甲',
                desc: '时家奇门排盘，展示九宫八门、九星、八神分布格局。提供方位吉凶、值符值使分析、特殊格局解读，辅助决策趋吉避凶。',
                href: '/qimen',
              },
              {
                icon: '🌸',
                title: '梅花易数',
                desc: '支持数字、时间、文字、硬币等多种起卦方式，展示本卦、互卦、变卦及体用关系。提供六十四卦详解和爻辞解读。',
                href: '/meihua',
              },
            ].map((service) => (
              <div key={service.title} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-4xl flex-shrink-0">{service.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{service.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">{service.desc}</p>
                  <Link href={service.href} className="text-sm text-red-700 hover:text-red-900 font-medium">
                    立即体验 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 联系我们 */}
        <div className="card">
          <h2 className="card-title">联系我们</h2>
          <div className="text-gray-600 space-y-2 text-sm">
            <p>如果您有任何问题、建议或合作意向，欢迎通过以下方式与我们联系。</p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
              <p><span className="font-medium text-gray-800">邮箱：</span>support@mingliwang.com</p>
              <p><span className="font-medium text-gray-800">微信公众号：</span>命理网</p>
              <p><span className="font-medium text-gray-800">在线时间：</span>工作日 9:00 - 18:00</p>
            </div>
            <p className="text-xs text-gray-400 mt-4">* 命理分析仅供娱乐参考，请理性看待</p>
          </div>
        </div>
      </div>
    </div>
  );
}
