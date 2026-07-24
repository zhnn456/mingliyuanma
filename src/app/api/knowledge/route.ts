import { NextRequest, NextResponse } from 'next/server';
import { KNOWLEDGE_ARTICLES, getArticleById, getArticlesByCategory, searchArticles } from '@/lib/knowledge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const keyword = searchParams.get('keyword');

    if (id) {
      const article = getArticleById(id);
      if (!article) {
        return NextResponse.json({ error: '文章不存在' }, { status: 404 });
      }
      return NextResponse.json({ article });
    }

    let articles = KNOWLEDGE_ARTICLES;

    if (category) {
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
      })),
      total: articles.length,
    });
  } catch (error) {
    console.error('获取知识文章失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
