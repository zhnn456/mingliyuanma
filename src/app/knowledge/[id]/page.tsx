import type { Metadata } from 'next';
import { getBrandName } from '@/lib/brand';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllArticles,
  getArticleById,
  getRelatedArticles,
  getPrevNextArticle,
} from '@/lib/knowledge/server';
import { markdownToHtml, extractTOC } from '@/lib/knowledge/markdown';
import type { KnowledgeArticle } from '@/lib/knowledge/types';

const BASE_URL = 'https://ming8.online';

/* ========== 分类 → 工具映射（内链到工具页） ========== */
const TOOL_MAP: Record<string, { name: string; href: string; icon: string; desc: string }> = {
  bazi: { name: '四柱八字排盘', href: '/bazi', icon: '☰', desc: '输入出生信息，免费在线生成生辰八字命盘' },
  ziwei: { name: '紫微斗数排盘', href: '/ziwei', icon: '★', desc: '免费安布十二宫星曜命盘，解读人生格局' },
  qimen: { name: '奇门遁甲排盘', href: '/qimen', icon: '⚔', desc: '时家奇门自动布局，择时趋吉避凶' },
  meihua: { name: '梅花易数起卦', href: '/meihua', icon: '✿', desc: '时间或数字起卦，体用生克断吉凶' },
};

/* ========== 封面图映射（与客户端一致） ========== */
function getArticleImage(article: { id: string; category: string }): string | null {
  const diagramCovers: Record<string, string> = {
    'wuxing-tuxing': '/images/knowledge/basic/wuxing.svg',
    'ganzhi-liushi': '/images/knowledge/basic/ganzhi.svg',
    'jieqi-lifa': '/images/knowledge/basic/jieqi.svg',
    'bazi-sizhu-tuxing': '/images/knowledge/bazi/sizhu.svg',
    'bazi-shishen-tuxing': '/images/knowledge/bazi/shishen.svg',
    'ziwei-gongwei-tuxing': '/images/knowledge/ziwei/gongwei.svg',
    'qimen-jiugong': '/images/knowledge/qimen/jiugong.svg',
    'qimen-sanpan': '/images/knowledge/qimen/sanpan.svg',
    'meihua-bagua-fangwei': '/images/knowledge/meihua/bagua.svg',
    'meihua-liushisi-tuxing': '/images/knowledge/meihua/liushisi.svg',
  };
  if (diagramCovers[article.id]) return diagramCovers[article.id];
  const catDefaults: Record<string, string> = {
    basic: '/images/knowledge/categories/basic.jpg',
    bazi: '/images/knowledge/categories/bazi.jpg',
    ziwei: '/images/knowledge/categories/ziwei.jpg',
    qimen: '/images/knowledge/categories/qimen.jpg',
    meihua: '/images/knowledge/categories/meihua.jpg',
  };
  return catDefaults[article.category] || null;
}

function getCategoryColor(cat: string): string {
  const map: Record<string, string> = {
    basic: 'bg-amber-50 text-amber-700 border-amber-200',
    bazi: 'bg-red-50 text-red-700 border-red-200',
    ziwei: 'bg-purple-50 text-purple-700 border-purple-200',
    qimen: 'bg-blue-50 text-blue-700 border-blue-200',
    meihua: 'bg-pink-50 text-pink-700 border-pink-200',
  };
  return map[cat] || 'bg-gray-50 text-gray-600 border-gray-200';
}

function getLevelColor(level: string): string {
  const map: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700 border-green-200',
    intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
    advanced: 'bg-purple-100 text-purple-700 border-purple-200',
    expert: 'bg-red-100 text-red-700 border-red-200',
  };
  return map[level] || 'bg-gray-100 text-gray-700 border-gray-200';
}

/* ========== 静态参数：构建时生成全部文章页 ========== */
export function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map(a => ({ id: a.id }));
}

/* ========== 元数据 ========== */
export const revalidate = 60; // 品牌名等动态元数据定期重新生成（ISR）
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = getArticleById(id);
  if (!article) return { title: '文章不存在' };

  const title = `${article.title} - 传统文化知识`;
  const description = article.summary || `${article.title}：${article.categoryName}入门到进阶的知识详解。`;
  const brandName = await getBrandName();

  return {
    title,
    description,
    keywords: article.tags,
    alternates: { canonical: `${BASE_URL}/knowledge/${article.id}` },
    openGraph: {
      title: `${article.title} - ${brandName}`,
      description,
      type: 'article',
      locale: 'zh_CN',
      siteName: brandName,
      url: `${BASE_URL}/knowledge/${article.id}`,
      images: getArticleImage(article) ? [{ url: `${BASE_URL}${getArticleImage(article)}` }] : undefined,
    },
  };
}

/* ========== JSON-LD 结构化数据 ========== */
function buildJsonLd(article: KnowledgeArticle, prev: KnowledgeArticle | null, next: KnowledgeArticle | null, related: KnowledgeArticle[], brandName: string) {
  const url = `${BASE_URL}/knowledge/${article.id}`;
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    articleSection: article.categoryName,
    keywords: article.tags.join(','),
    inLanguage: 'zh-CN',
    author: { '@type': 'Organization', name: brandName, url: BASE_URL },
    publisher: { '@type': 'Organization', name: brandName, url: BASE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: '2026-01-01',
    dateModified: '2026-08-12',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: '传统文化学堂', item: `${BASE_URL}/knowledge` },
      { '@type': 'ListItem', position: 3, name: article.categoryName, item: `${BASE_URL}/knowledge?category=${article.category}` },
      { '@type': 'ListItem', position: 4, name: article.title, item: url },
    ],
  };

  const scripts: object[] = [articleLd, breadcrumbLd];

  // FAQ schema：从正文提取 ## 标题作为常见问题
  const faqItems = extractTOC(article.content)
    .filter(t => t.level === 2)
    .slice(0, 5)
    .map((t, i) => ({
      '@type': 'Question',
      name: t.title,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `关于「${t.title}」的详细解析，请阅读知微阁《${article.title}》全文。`,
      },
    }));
  if (faqItems.length >= 2) {
    scripts.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems,
    });
  }

  // 相关文章 ItemList（内部链接信号）
  if (related.length >= 2) {
    scripts.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: '相关文章',
      itemListElement: related.map((r, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: r.title,
        url: `${BASE_URL}/knowledge/${r.id}`,
      })),
    });
  }

  return scripts.map(s => JSON.stringify(s)).join('\n');
}

/* ========== 页面组件 ========== */
export default async function KnowledgeArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = getArticleById(id);
  if (!article) notFound();

  const contentHtml = markdownToHtml(article.content);
  const toc = extractTOC(article.content);
  const { prev, next } = getPrevNextArticle(id);
  const related = getRelatedArticles(id);
  const brandName = await getBrandName();
  const jsonLd = buildJsonLd(article, prev, next, related, brandName);
  const image = getArticleImage(article);

  const relatedPool = related.length >= 2 ? related : getAllArticles().filter(a => a.id !== id && a.category === article.category).slice(0, 3);

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 面包屑 */}
          <nav aria-label="面包屑" className="text-sm text-gray-500 mb-6">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:text-red-700 transition-colors">首页</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link href="/knowledge" className="hover:text-red-700 transition-colors">传统文化学堂</Link></li>
              <li aria-hidden="true">›</li>
              <li>
                <Link href={`/knowledge?category=${article.category}`} className="hover:text-red-700 transition-colors">
                  {article.categoryName}
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium truncate max-w-[200px]">{article.title}</li>
            </ol>
          </nav>

          <div className="flex gap-8">
            {/* 文章内容 */}
            <div className="flex-1 min-w-0">
              <article className="card">
                {/* 文章头部 */}
                <header className="flex items-start gap-4 mb-6">
                  <span className="text-5xl flex-shrink-0" aria-hidden="true">{article.icon}</span>
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-kai mb-3">{article.title}</h1>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(article.category)}`}>
                        {article.categoryName}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getLevelColor(article.level)}`}>
                        {article.levelName}
                      </span>
                      {article.readingTime && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          预计阅读 {article.readingTime} 分钟
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 mt-3 text-sm leading-relaxed">{article.summary}</p>
                  </div>
                </header>

                {/* 封面图 */}
                {image && (
                  <div className="mb-6 rounded-xl overflow-hidden shadow-md">
                    <img src={image} alt={article.title} className="w-full h-64 object-cover" />
                  </div>
                )}

                {/* 标签 */}
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6 pb-6 border-b border-gray-100">
                    {article.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs border border-gray-100">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 正文（服务端渲染，爬虫可见） */}
                <div
                  className="prose max-w-none"
                  id="article-content"
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />

                {/* 底部标签 */}
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                    {article.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>

              {/* 上下篇导航 */}
              <nav aria-label="文章导航" className="flex justify-between gap-4 mt-6">
                {prev ? (
                  <Link href={`/knowledge/${prev.id}`} className="flex-1 card text-left hover:shadow-md transition-all group">
                    <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      上一篇
                    </div>
                    <div className="font-medium text-gray-800 group-hover:text-red-700 transition-colors truncate">
                      {prev.title}
                    </div>
                  </Link>
                ) : <div className="flex-1" />}
                {next ? (
                  <Link href={`/knowledge/${next.id}`} className="flex-1 card text-right hover:shadow-md transition-all group">
                    <div className="text-xs text-gray-400 mb-1 flex items-center gap-1 justify-end">
                      下一篇
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div className="font-medium text-gray-800 group-hover:text-red-700 transition-colors truncate">
                      {next.title}
                    </div>
                  </Link>
                ) : <div className="flex-1" />}
              </nav>

              {/* 相关文章 */}
              {relatedPool.length > 0 && (
                <section className="mt-8" aria-label="相关文章">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 font-kai">相关文章</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {relatedPool.map(ra => (
                      <Link
                        key={ra.id}
                        href={`/knowledge/${ra.id}`}
                        className="card text-left hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" aria-hidden="true">{ra.icon}</span>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-800 group-hover:text-red-700 transition-colors truncate">
                              {ra.title}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{ra.categoryName} · {ra.levelName}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* 相关工具（内链：文章 → 工具页） */}
              {TOOL_MAP[article.category] && (
                <section className="mt-8" aria-label="相关工具">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 font-kai">在线工具</h2>
                  <Link
                    href={TOOL_MAP[article.category].href}
                    className="card flex items-center gap-4 p-4 hover:shadow-md transition-all group"
                  >
                    <span className="text-3xl" aria-hidden="true">{TOOL_MAP[article.category].icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 group-hover:text-red-700 transition-colors">
                        {TOOL_MAP[article.category].name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {TOOL_MAP[article.category].desc}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </section>
              )}
            </div>

            {/* 目录侧边栏 */}
            {toc.length > 0 && (
              <aside className="hidden lg:block w-56 flex-shrink-0" aria-label="目录">
                <div className="sticky top-24">
                  <div className="card !p-4">
                    <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      目录
                    </h2>
                    <nav className="space-y-1">
                      {toc.map((item, i) => (
                        <a
                          key={i}
                          href={`#${item.id}`}
                          className={`block text-sm text-gray-500 hover:text-red-700 transition-colors ${item.level === 3 ? 'pl-4 text-xs' : ''}`}
                        >
                          {item.title}
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
