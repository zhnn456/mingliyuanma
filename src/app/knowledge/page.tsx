'use client';

import { useState, useEffect } from 'react';
import { KNOWLEDGE_CATEGORIES } from '@/lib/knowledge';

interface Article {
  id: string;
  title: string;
  category: string;
  categoryName: string;
  summary: string;
  icon: string;
  level: string;
  levelName: string;
  tags: string[];
}

interface ArticleDetail {
  id: string;
  title: string;
  category: string;
  categoryName: string;
  summary: string;
  icon: string;
  level: string;
  levelName: string;
  tags: string[];
  content: string;
}

export default function KnowledgePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDetail | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/knowledge?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge?id=${id}`);
      const data = await res.json();
      if (data.article) {
        setSelectedArticle(data.article);
      }
    } catch {}
  };

  const handleSearch = () => {
    fetchArticles();
  };

  const getLevelColor = (level: string) => {
    if (level === 'beginner') return 'bg-green-100 text-green-700 border-green-200';
    if (level === 'intermediate') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (level === 'advanced') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // 渲染 Markdown 内容（简化版）
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold text-gray-900 mt-6 mb-3 chinese-red">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-gray-800 mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="text-gray-700 ml-4 list-disc mb-1">{line.replace('- ', '')}</li>;
      }
      if (line.startsWith('|')) {
        // 简单表格行
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        if (cells.every(c => c.match(/^[-:]+$/))) return null; // 分隔行
        return (
          <div key={i} className="flex border-b border-gray-100 py-1">
            {cells.map((cell, ci) => (
              <span key={ci} className={`flex-1 text-sm px-2 ${ci === 0 ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                {cell}
              </span>
            ))}
          </div>
        );
      }
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} className="text-gray-700 leading-relaxed mb-2">{line}</p>;
    });
  };

  // 文章详情页
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-red-700 hover:text-red-900 mb-6 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回列表
          </button>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{selectedArticle.icon}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedArticle.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">{selectedArticle.categoryName}</span>
                  <span className={`px-2 py-0.5 rounded text-xs border ${getLevelColor(selectedArticle.level)}`}>
                    {selectedArticle.levelName}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="prose max-w-none">
                {renderContent(selectedArticle.content)}
              </div>
            </div>

            <div className="border-t mt-6 pt-4">
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 列表页
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">命理知识</h1>
          <p className="text-gray-600">系统学习命理知识，从入门到精通</p>
        </div>

        {/* 分类标签 */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !selectedCategory ? 'bg-red-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
            }`}
          >
            全部
          </button>
          {KNOWLEDGE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat.id ? 'bg-red-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索文章..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
            <button onClick={handleSearch} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800">
              搜索
            </button>
          </div>
        </div>

        {/* 分类介绍卡片 */}
        {!selectedCategory && !keyword && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {KNOWLEDGE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="card text-left hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h3 className="font-bold text-gray-900">{cat.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
              </button>
            ))}
          </div>
        )}

        {/* 文章列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">📚</div>
            <p>暂无相关文章</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map(article => (
              <button
                key={article.id}
                onClick={() => fetchArticleDetail(article.id)}
                className="card text-left hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{article.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.summary}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {article.categoryName}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs border ${getLevelColor(article.level)}`}>
                        {article.levelName}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs text-gray-400">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
