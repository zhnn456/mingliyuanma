import Link from 'next/link';
import { getArticlesByCategory } from '@/lib/knowledge/server';
import type { KnowledgeArticle } from '@/lib/knowledge/types';

const BASE_URL = 'https://ming8.online';

interface SeoFaq {
  q: string;
  a: string;
}

interface ToolSeoContentProps {
  /** 工具名称，如：四柱八字排盘 */
  toolName: string;
  /** 工具页面路径，如：/bazi */
  toolPath: string;
  /** 工具说明段落（每段渲染为一个 <p>，服务端输出，爬虫可见） */
  introParagraphs: string[];
  /** 常见问题（FAQPage 结构化数据 + 页面可见问答） */
  faqs: SeoFaq[];
  /** 相关文章知识库分类：basic | bazi | ziwei | qimen | meihua */
  relatedCategory: string;
}

/**
 * 工具页 SEO 内容组件（Server Component）
 * - 输出 WebApplication + FAQPage JSON-LD 结构化数据
 * - 输出工具说明正文、FAQ 问答、相关文章内链（解决客户端渲染工具的薄内容问题）
 */
export default function ToolSeoContent({
  toolName,
  toolPath,
  introParagraphs,
  faqs,
  relatedCategory,
}: ToolSeoContentProps) {
  const related: KnowledgeArticle[] = getArticlesByCategory(relatedCategory).slice(0, 6);
  const toolUrl = `${BASE_URL}${toolPath}`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: `${toolName} - 知微阁`,
        url: toolUrl,
        description: introParagraphs[0],
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        inLanguage: 'zh-CN',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY',
        },
        publisher: {
          '@type': 'Organization',
          name: '知微阁',
          url: BASE_URL,
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      },
    ],
  });

  return (
    <>
      {/* 结构化数据：WebApplication + FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 工具说明 */}
        <article className="card p-6 md:p-8 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-kai mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-red-700 rounded-full" aria-hidden="true" />
            {toolName}介绍
          </h2>
          <div className="space-y-3">
            {introParagraphs.map((p, i) => (
              <p key={i} className="text-gray-700 leading-relaxed text-[15px]">
                {p}
              </p>
            ))}
          </div>
        </article>

        {/* 常见问题 */}
        <article className="card p-6 md:p-8 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-kai mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-red-700 rounded-full" aria-hidden="true" />
            常见问题
          </h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-800 mb-1.5">{f.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </article>

        {/* 相关阅读（内链到知识库，构建内链架构） */}
        {related.length > 0 && (
          <article className="card p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-kai mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-700 rounded-full" aria-hidden="true" />
              相关阅读
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {related.map(a => (
                <li key={a.id}>
                  <Link
                    href={`/knowledge/${a.id}`}
                    className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 hover:border-red-200 hover:shadow-sm transition-all group"
                  >
                    <span aria-hidden="true">{a.icon}</span>
                    <span className="text-sm text-gray-700 group-hover:text-red-700 transition-colors">
                      {a.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        )}
      </section>
    </>
  );
}
