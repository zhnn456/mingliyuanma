import { NextRequest, NextResponse } from 'next/server';
import {
  getAllArticles,
  getArticleById,
  getArticlesByCategory,
  searchArticles,
  getRelatedArticles,
  getPrevNextArticle,
} from '@/lib/knowledge/server';
import { LEARNING_PATHS } from '@/lib/knowledge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const keyword = searchParams.get('keyword');
    const related = searchParams.get('related');
    const type = searchParams.get('type');

    // 获取学习路径
    if (type === 'learning-paths') {
      return NextResponse.json({ paths: LEARNING_PATHS });
    }

    // 获取相关文章
    if (related) {
      const relatedArticles = getRelatedArticles(related);
      return NextResponse.json({ articles: relatedArticles });
    }

    // 获取单篇文章（含上下篇导航）
    if (id) {
      const article = getArticleById(id);
      if (!article) {
        return NextResponse.json({ error: '文章不存在' }, { status: 404 });
      }
      const nav = getPrevNextArticle(id);
      const relatedArticles = getRelatedArticles(id);
      return NextResponse.json({
        article,
        prev: nav.prev ? { id: nav.prev.id, title: nav.prev.title } : null,
        next: nav.next ? { id: nav.next.id, title: nav.next.title } : null,
        relatedArticles,
      });
    }

    // 文章列表
    let articles = getAllArticles();
    if (category && category !== 'all') {
      articles = getArticlesByCategory(category);
    }
    if (keyword) {
      articles = searchArticles(keyword);
    }

    return NextResponse.json({
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        categoryName: a.categoryName,
        summary: a.summary,
        icon: a.icon,
        level: a.level,
        levelName: a.levelName,
        tags: a.tags,
        order: a.order,
        readingTime: a.readingTime,
      })),
      total: articles.length,
    });
  } catch (error) {
    console.error('获取知识文章失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
