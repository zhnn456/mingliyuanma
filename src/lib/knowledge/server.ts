/**
 * 命理知识系统 - 服务端
 * 开发环境：读取 data/knowledge/*.md（支持热更新）
 * 生产环境：使用构建时预生成的 JSON 数据
 */

import type { KnowledgeArticle, ArticleCategory, ArticleLevel } from './types';
import { KNOWLEDGE_ARTICLES } from './generated';

// ============ Frontmatter 解析 ============

interface Frontmatter {
  title?: string;
  category?: ArticleCategory;
  categoryName?: string;
  summary?: string;
  tags?: string;
  level?: ArticleLevel;
  levelName?: string;
  icon?: string;
  order?: number;
  relatedIds?: string;
  prevId?: string;
  nextId?: string;
  readingTime?: number;
}

function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const frontmatter: Frontmatter = {};
  let body = content;
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (match) {
    const fmStr = match[1];
    body = match[2].trim();
    fmStr.split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
      switch (key) {
        case 'tags': frontmatter.tags = value; break;
        case 'relatedIds': frontmatter.relatedIds = value; break;
        case 'order': frontmatter.order = parseInt(value) || 0; break;
        case 'readingTime': frontmatter.readingTime = parseInt(value) || 0; break;
        default: (frontmatter as any)[key] = value;
      }
    });
  }
  return { frontmatter, body };
}

const LEVEL_NAMES: Record<ArticleLevel, string> = {
  beginner: '入门', intermediate: '进阶', advanced: '高级', expert: '精通',
};
const CATEGORY_NAMES: Record<ArticleCategory, string> = {
  basic: '命理基础', bazi: '四柱八字', ziwei: '紫微斗数', qimen: '奇门遁甲', meihua: '梅花易数',
};

// ============ 文章加载 ============

let _articlesCache: KnowledgeArticle[] | null = null;
let _articlesMap: Map<string, KnowledgeArticle> | null = null;

function loadArticles(): KnowledgeArticle[] {
  if (_articlesCache) return _articlesCache;

  let articles: KnowledgeArticle[] = [];

  if (true) {
    // 开发环境：从文件系统读取
    try {
      const fsMod = require('fs');
      const pathMod = require('path');
      const knowledgeDir = pathMod.join(process.cwd(), 'data', 'knowledge');

      if (fsMod.existsSync(knowledgeDir)) {
        const cats = fsMod.readdirSync(knowledgeDir, { withFileTypes: true });
        for (const catDir of cats) {
          if (!catDir.isDirectory()) continue;
          const category = catDir.name as ArticleCategory;
          const catPath = pathMod.join(knowledgeDir, category);
          const files = fsMod.readdirSync(catPath).filter((f: string) => f.endsWith('.md'));

          for (const file of files) {
            const filePath = pathMod.join(catPath, file);
            const rawContent = fsMod.readFileSync(filePath, 'utf-8');
            const { frontmatter, body } = parseFrontmatter(rawContent);
            const id = file.replace(/\.md$/, '');
            let fileMtime: Date | undefined;
            try {
              const stat = fsMod.statSync(filePath);
              fileMtime = stat.mtime;
            } catch { /* 忽略 */ }

            articles.push({
              id, title: frontmatter.title || id,
              category: frontmatter.category || category,
              categoryName: frontmatter.categoryName || CATEGORY_NAMES[category] || category,
              summary: frontmatter.summary || '', content: body,
              tags: frontmatter.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [],
              level: frontmatter.level || 'beginner',
              levelName: frontmatter.levelName || LEVEL_NAMES[frontmatter.level || 'beginner'],
              icon: frontmatter.icon || '📄', order: frontmatter.order || 0,
              relatedIds: frontmatter.relatedIds?.split(',').map((t: string) => t.trim()).filter(Boolean) || [],
              prevId: frontmatter.prevId, nextId: frontmatter.nextId,
              readingTime: frontmatter.readingTime || Math.max(1, Math.ceil(body.length / 500)),
              lastModified: fileMtime,
            });
          }
        }

        articles.sort((a, b) => (a.order || 999) - (b.order || 999));
        _articlesCache = articles;
        _articlesMap = new Map(articles.map(a => [a.id, a]));
        return articles;
      }
    } catch {
      // fs 不可用时，fall through 到预生成数据
    }
  }

  // 生产环境：使用构建时预生成的数据
  articles = KNOWLEDGE_ARTICLES as KnowledgeArticle[];
  _articlesCache = articles;
  _articlesMap = new Map(articles.map(a => [a.id, a]));
  return articles;
}

// ============ 公开 API ============

export function getAllArticles(): KnowledgeArticle[] {
  return loadArticles();
}

export function getArticleById(id: string): KnowledgeArticle | null {
  if (!_articlesMap) loadArticles();
  return _articlesMap?.get(id) || null;
}

export function getArticlesByCategory(category: string): KnowledgeArticle[] {
  return loadArticles().filter(a => a.category === category);
}

export function searchArticles(keyword: string): KnowledgeArticle[] {
  const kw = keyword.toLowerCase();
  return loadArticles().filter(a =>
    a.title.toLowerCase().includes(kw) ||
    a.summary.toLowerCase().includes(kw) ||
    a.tags.some(t => t.toLowerCase().includes(kw)) ||
    a.content.toLowerCase().includes(kw)
  );
}

export function getRelatedArticles(articleId: string): KnowledgeArticle[] {
  const article = getArticleById(articleId);
  if (!article?.relatedIds?.length) return [];
  return article.relatedIds.map(id => getArticleById(id)).filter(Boolean) as KnowledgeArticle[];
}

export function getPrevNextArticle(articleId: string): { prev: KnowledgeArticle | null; next: KnowledgeArticle | null } {
  const articles = loadArticles();
  const idx = articles.findIndex(a => a.id === articleId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? articles[idx - 1] : null,
    next: idx < articles.length - 1 ? articles[idx + 1] : null,
  };
}
