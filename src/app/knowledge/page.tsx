'use client';

import { useState, useEffect, useCallback } from 'react';
import { KNOWLEDGE_CATEGORIES, LEARNING_PATHS } from '@/lib/knowledge/types';
import type { LearningPath } from '@/lib/knowledge/types';

interface Article {
  id: string;
  title: string;
  category: string;
  categoryName: string;
  summary: string;
  icon: string;
  image?: string;
  level: string;
  levelName: string;
  tags: string[];
  order?: number;
  readingTime?: number;
}

interface ArticleDetail extends Article {
  content: string;
}

interface PrevNext {
  id: string;
  title: string;
}

/* ========== Markdown 简易渲染 ========== */
function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let inList = false;
  let listItems: JSX.Element[] = [];
  let listIndex = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      const isOrdered = listItems[0].key?.toString().startsWith('ol-');
      elements.push(
        isOrdered ? (
          <ol key={`ol-${listIndex}`} className="list-decimal pl-6 space-y-1.5 mb-4">
            {listItems}
          </ol>
        ) : (
          <ul key={`ul-${listIndex}`} className="list-disc pl-6 space-y-1.5 mb-4">
            {listItems}
          </ul>
        )
      );
      listItems = [];
      listIndex++;
    }
    inList = false;
  };

  lines.forEach((line, i) => {
    // 标题
    const h1Match = line.match(/^## (.+)/);
    if (h1Match) {
      flushList();
      elements.push(<h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-100">{h1Match[1]}</h2>);
      return;
    }
    const h2Match = line.match(/^### (.+)/);
    if (h2Match) {
      flushList();
      elements.push(<h3 key={i} className="text-lg font-bold text-gray-800 mt-6 mb-3">{h2Match[1]}</h3>);
      return;
    }
    const h3Match = line.match(/^#### (.+)/);
    if (h3Match) {
      flushList();
      elements.push(<h4 key={i} className="text-base font-bold text-gray-700 mt-4 mb-2">{h3Match[1]}</h4>);
      return;
    }
    // 图片 ![alt](url)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushList();
      elements.push(
        <div key={i} className="my-6 text-center">
          <img src={imgMatch[2]} alt={imgMatch[1]} className="max-w-full rounded-xl shadow-md mx-auto" loading="lazy" />
          {imgMatch[1] && <p className="text-xs text-gray-400 mt-2">{imgMatch[1]}</p>}
        </div>
      );
      return;
    }

    // 粗体行
    const boldMatch = line.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      flushList();
      elements.push(<p key={i} className="font-bold text-gray-800 mt-4 mb-2">{boldMatch[1]}</p>);
      return;
    }

    // 列表项
    const ulMatch = line.match(/^- (.+)/);
    if (ulMatch) {
      inList = true;
      listItems.push(<li key={`li-${i}`} className="text-gray-700 leading-relaxed">{ulMatch[1]}</li>);
      return;
    }
    const olMatch = line.match(/^\d+\. (.+)/);
    if (olMatch) {
      inList = true;
      listItems.push(<li key={`ol-li-${i}`} className="text-gray-700 leading-relaxed">{olMatch[1]}</li>);
      return;
    }

    // 空行
    if (line.trim() === '') {
      flushList();
      return;
    }

    flushList();

    // 带内联格式的段落
    let processed = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-red-700 px-1 rounded text-sm">$1</code>');

    elements.push(
      <p key={i} className="text-gray-700 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: processed }} />
    );
  });

  flushList();
  return elements;
}

/* ========== 文章封面图映射 ========== */
// 图解类文章用对应的知识图解 SVG 作为封面，其余文章用分类真实照片
function getArticleImage(article: { id: string; category: string }): string | null {
  const diagramCovers: Record<string, string> = {
    // 文化基础图解
    'wuxing-tuxing': '/images/knowledge/basic/wuxing.svg',
    'ganzhi-liushi': '/images/knowledge/basic/ganzhi.svg',
    'jieqi-lifa': '/images/knowledge/basic/jieqi.svg',
    // 四柱八字图解
    'bazi-sizhu-tuxing': '/images/knowledge/bazi/sizhu.svg',
    'bazi-shishen-tuxing': '/images/knowledge/bazi/shishen.svg',
    // 紫微斗数图解
    'ziwei-gongwei-tuxing': '/images/knowledge/ziwei/gongwei.svg',
    // 奇门遁甲图解
    'qimen-jiugong': '/images/knowledge/qimen/jiugong.svg',
    'qimen-sanpan': '/images/knowledge/qimen/sanpan.svg',
    // 梅花易数图解
    'meihua-bagua-fangwei': '/images/knowledge/meihua/bagua.svg',
    'meihua-liushisi-tuxing': '/images/knowledge/meihua/liushisi.svg',
  };
  if (diagramCovers[article.id]) return diagramCovers[article.id];
  // 分类真实照片（Wikimedia Commons 公有领域/CC0，可商用）
  const catDefaults: Record<string, string> = {
    basic: '/images/knowledge/categories/basic.jpg',
    bazi: '/images/knowledge/categories/bazi.jpg',
    ziwei: '/images/knowledge/categories/ziwei.jpg',
    qimen: '/images/knowledge/categories/qimen.jpg',
    meihua: '/images/knowledge/categories/meihua.jpg',
  };
  return catDefaults[article.category] || null;
}

/* ========== 目录提取 ========== */
function extractTOC(content: string): { id: string; title: string; level: number }[] {
  const toc: { id: string; title: string; level: number }[] = [];
  content.split('\n').forEach(line => {
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      const id = h2[1].replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '');
      toc.push({ id, title: h2[1], level: 2 });
    }
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      const id = h3[1].replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '');
      toc.push({ id, title: h3[1], level: 3 });
    }
  });
  return toc;
}

export default function KnowledgePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDetail | null>(null);
  const [prevArticle, setPrevArticle] = useState<PrevNext | null>(null);
  const [nextArticle, setNextArticle] = useState<PrevNext | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'learning'>('browse');

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/knowledge?${params}`);
      const data = await res.json();
	      setArticles((data.articles || []).map((a: any) => ({ ...a, image: a.image || getArticleImage(a) })));
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, keyword]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const fetchArticleDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge?id=${id}`);
      const data = await res.json();
      if (data.article) {
        setSelectedArticle({ ...data.article, image: data.article?.image || getArticleImage(data.article) });
        setPrevArticle(data.prev);
        setNextArticle(data.next);
        setRelatedArticles(data.relatedArticles || []);
      }
    } catch {}
  };

  const handleSearch = () => {
    fetchArticles();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'advanced': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'expert': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryColor = (cat: string) => {
    const c = KNOWLEDGE_CATEGORIES.find(c => c.id === cat);
    return c?.color || 'gray';
  };

  const filteredArticles = selectedLevel
    ? articles.filter(a => a.level === selectedLevel)
    : articles;

  // ===== 文章详情页 =====
  if (selectedArticle) {
    const toc = extractTOC(selectedArticle.content);

    return (
      <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 返回按钮 */}
          <button
            onClick={() => { setSelectedArticle(null); setRelatedArticles([]); }}
            className="flex items-center gap-2 text-red-700 hover:text-red-900 mb-6 font-medium transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回知识列表
          </button>

          <div className="flex gap-8">
            {/* 文章内容 */}
            <div className="flex-1 min-w-0">
              <div className="card">
                {/* 文章头部 */}
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-5xl flex-shrink-0">{selectedArticle.icon}</span>
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-kai mb-3">{selectedArticle.title}</h1>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        getCategoryColor(selectedArticle.category) === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
                        getCategoryColor(selectedArticle.category) === 'purple' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        getCategoryColor(selectedArticle.category) === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        getCategoryColor(selectedArticle.category) === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-pink-50 text-pink-700 border-pink-200'
                      }`}>
                        {selectedArticle.categoryName}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getLevelColor(selectedArticle.level)}`}>
                        {selectedArticle.levelName}
                      </span>
                      {selectedArticle.readingTime && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          预计阅读 {selectedArticle.readingTime} 分钟
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 mt-3 text-sm leading-relaxed">{selectedArticle.summary}</p>
                  </div>
                </div>

                {/* 封面图 */}
                {selectedArticle.image && (
                  <div className="mb-6 rounded-xl overflow-hidden shadow-md">
                    <img src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-64 object-cover" />
                  </div>
                )}

                {/* 标签 */}
                {selectedArticle.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6 pb-6 border-b border-gray-100">
                    {selectedArticle.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs border border-gray-100">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 文章正文 */}
                <div className="prose max-w-none" id="article-content">
                  {renderMarkdown(selectedArticle.content)}
                </div>

                {/* 标签（底部） */}
                {selectedArticle.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                    {selectedArticle.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 上下篇导航 */}
              {(prevArticle || nextArticle) && (
                <div className="flex justify-between gap-4 mt-6">
                  {prevArticle ? (
                    <button
                      onClick={() => fetchArticleDetail(prevArticle.id)}
                      className="flex-1 card text-left hover:shadow-md transition-all group"
                    >
                      <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        上一篇
                      </div>
                      <div className="font-medium text-gray-800 group-hover:text-red-700 transition-colors truncate">
                        {prevArticle.title}
                      </div>
                    </button>
                  ) : <div className="flex-1" />}
                  {nextArticle ? (
                    <button
                      onClick={() => fetchArticleDetail(nextArticle.id)}
                      className="flex-1 card text-right hover:shadow-md transition-all group"
                    >
                      <div className="text-xs text-gray-400 mb-1 flex items-center gap-1 justify-end">
                        下一篇
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="font-medium text-gray-800 group-hover:text-red-700 transition-colors truncate">
                        {nextArticle.title}
                      </div>
                    </button>
                  ) : <div className="flex-1" />}
                </div>
              )}

              {/* 相关文章 */}
              {relatedArticles.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 font-kai">相关文章</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {relatedArticles.map(ra => (
                      <button
                        key={ra.id}
                        onClick={() => fetchArticleDetail(ra.id)}
                        className="card text-left hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{ra.icon}</span>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-800 group-hover:text-red-700 transition-colors truncate">
                              {ra.title}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{ra.categoryName} · {ra.levelName}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 目录侧边栏 */}
            {toc.length > 0 && (
              <div className="hidden lg:block w-56 flex-shrink-0">
                <div className="sticky top-24">
                  <div className="card !p-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      目录
                    </h4>
                    <nav className="space-y-1">
                      {toc.map((item, i) => (
                        <a
                          key={i}
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`block text-sm text-gray-500 hover:text-red-700 transition-colors ${
                            item.level === 3 ? 'pl-4 text-xs' : ''
                          }`}
                        >
                          {item.title}
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== 列表页 =====
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-8 bg-gold/40" />
            <span className="text-gold text-sm font-medium tracking-widest">ACADEMY</span>
            <div className="h-px w-8 bg-gold/40" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-kai">传统文化学堂</h1>
          <p className="text-gray-500">传承千年智慧，从入门到精通</p>
        </div>

        {/* Tab 切换：浏览 / 学习路线 */}
        <div className="tab-nav mb-8 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('browse')}
            className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
          >
            📚 浏览知识
          </button>
          <button
            onClick={() => setActiveTab('learning')}
            className={`tab-btn ${activeTab === 'learning' ? 'active' : ''}`}
          >
            🗺️ 学习路线
          </button>
        </div>

        {/* ===== 学习路线视图 ===== */}
        {activeTab === 'learning' && (
          <div className="space-y-10">
            {LEARNING_PATHS.map(path => (
              <div key={path.id} className="card">
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-4xl">{path.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-kai">{path.name}</h2>
                    <p className="text-gray-500 mt-1">{path.description}</p>
                    <span className="text-xs text-gray-400 mt-1 inline-block">{path.totalArticles} 篇文章</span>
                  </div>
                </div>

                <div className="relative">
                  {/* 时间线 */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gold/30" />

                  <div className="space-y-6">
                    {path.stages.map((stage, si) => (
                      <div key={si} className="relative pl-14">
                        {/* 阶段圆点 */}
                        <div className="absolute left-3 top-1 w-4 h-4 rounded-full bg-gold border-2 border-white shadow" />

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <h3 className="font-bold text-gray-800 mb-1">
                            第{si + 1}步：{stage.name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-3">{stage.description}</p>

                          <div className="flex flex-wrap gap-2">
                            {stage.articles.map(aid => {
                              // 假设通过文章标题查找（简化处理）
                              const article = articles.find(a => a.id === aid);
                              return article ? (
                                <button
                                  key={aid}
                                  onClick={() => fetchArticleDetail(aid)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-sm text-gray-700 hover:text-red-700 hover:border-red-200 transition-colors"
                                >
                                  <span>{article.icon}</span>
                                  <span>{article.title}</span>
                                </button>
                              ) : (
                                <span key={aid} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-400">
                                  {aid}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== 浏览视图 ===== */}
        {activeTab === 'browse' && (
          <>
            {/* 分类标签 */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  !selectedCategory ? 'bg-red-700 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'
                }`}
              >
                全部
              </button>
              {KNOWLEDGE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedCategory === cat.id ? 'bg-red-700 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50 border'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* 难度筛选 + 搜索 */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8">
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { key: '', label: '全部难度' },
                  { key: 'beginner', label: '入门' },
                  { key: 'intermediate', label: '进阶' },
                  { key: 'advanced', label: '高级' },
                  { key: 'expert', label: '精通' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedLevel(opt.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedLevel === opt.key
                        ? 'bg-ink-700 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="搜索文章标题、标签..."
                  className="flex-1 form-input"
                />
                <button onClick={handleSearch} className="btn-primary !py-2 !px-4 text-sm">
                  搜索
                </button>
              </div>
            </div>

            {/* 分类介绍卡片（仅在首页显示） */}
            {!selectedCategory && !keyword && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {KNOWLEDGE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="card text-left hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        cat.color === 'red' ? 'bg-red-50' :
                        cat.color === 'purple' ? 'bg-purple-50' :
                        cat.color === 'blue' ? 'bg-blue-50' :
                        cat.color === 'amber' ? 'bg-amber-50' : 'bg-pink-50'
                      }`}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors">{cat.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-red-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 文章列表 */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-gray-500">加载中...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📚</div>
                <p className="text-gray-500 text-lg">暂无相关文章</p>
                <p className="text-gray-400 text-sm mt-1">试试其他分类或搜索关键词</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map(article => (
                  <button
                    key={article.id}
                    onClick={() => fetchArticleDetail(article.id)}
                    className="card overflow-hidden text-left hover:shadow-lg transition-all group"
                  >
                    {article.image || getArticleImage(article) ? (
                      <div className="w-full h-36 bg-gray-100 overflow-hidden">
                        <img src={article.image || getArticleImage(article) || ''} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      </div>
                    ) : (<span className="text-3xl flex-shrink-0 mt-1 ml-4">{article.icon}</span>)}
                    <div className="p-4 flex items-start gap-4">
                      {article.image && <span className="text-3xl flex-shrink-0 mt-1">{article.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{article.summary}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            article.category === 'basic' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            article.category === 'bazi' ? 'bg-red-50 text-red-700 border-red-200' :
                            article.category === 'ziwei' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            article.category === 'qimen' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-pink-50 text-pink-700 border-pink-200'
                          }`}>
                            {article.categoryName}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs border ${getLevelColor(article.level)}`}>
                            {article.levelName}
                          </span>
                          {article.readingTime && (
                            <span className="text-xs text-gray-400">{article.readingTime}分钟</span>
                          )}
                        </div>
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs text-gray-400">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
