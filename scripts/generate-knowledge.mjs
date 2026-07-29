/**
 * 知识文章构建时生成器
 * 读取 data/knowledge/ 下的 .md 文件，生成 TypeScript 数据文件
 * 用于 Cloudflare Workers 部署（无 fs 模块）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const knowledgeDir = path.join(root, 'data', 'knowledge');
const outputFile = path.join(root, 'src', 'lib', 'knowledge', 'generated.ts');

const LEVEL_NAMES = { beginner: '入门', intermediate: '进阶', advanced: '高级', expert: '精通' };
const CATEGORY_NAMES = {
  basic: '命理基础', bazi: '四柱八字', ziwei: '紫微斗数',
  qimen: '奇门遁甲', meihua: '梅花易数',
};

function parseFrontmatter(content) {
  const frontmatter = {};
  let body = content;
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (match) {
    const fmStr = match[1];
    body = match[2].trim();
    fmStr.split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
      frontmatter[key] = value;
    });
  }
  return { frontmatter, body };
}

const articles = [];

if (!fs.existsSync(knowledgeDir)) {
  console.warn('知识目录不存在:', knowledgeDir);
} else {
  const categories = fs.readdirSync(knowledgeDir, { withFileTypes: true });

  for (const catDir of categories) {
    if (!catDir.isDirectory()) continue;
    const category = catDir.name;
    const catPath = path.join(knowledgeDir, category);
    const files = fs.readdirSync(catPath).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(catPath, file);
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(rawContent);
      const id = file.replace(/\.md$/, '');

      const tags = frontmatter.tags
        ? frontmatter.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      const relatedIds = frontmatter.relatedIds
        ? frontmatter.relatedIds.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      articles.push({
        id,
        title: frontmatter.title || id,
        category: frontmatter.category || category,
        categoryName: frontmatter.categoryName || CATEGORY_NAMES[category] || category,
        summary: frontmatter.summary || '',
        content: body,
        tags,
        level: frontmatter.level || 'beginner',
        levelName: frontmatter.levelName || LEVEL_NAMES[frontmatter.level || 'beginner'],
        icon: frontmatter.icon || '📄',
        order: parseInt(frontmatter.order) || 0,
        relatedIds,
        prevId: frontmatter.prevId || undefined,
        nextId: frontmatter.nextId || undefined,
        readingTime: frontmatter.readingTime
          ? parseInt(frontmatter.readingTime)
          : Math.max(1, Math.ceil(body.length / 500)),
      });
    }
  }

  articles.sort((a, b) => (a.order || 999) - (b.order || 999));
}

// 生成 TypeScript 文件
const tsContent = `// 此文件由 scripts/generate-knowledge.mjs 自动生成
// 请勿手动修改 - 运行 npm run generate:knowledge 重新生成

export const KNOWLEDGE_ARTICLES = ${JSON.stringify(articles, null, 2)};
`;

fs.writeFileSync(outputFile, tsContent, 'utf-8');
console.log(`✅ 知识文章已生成: ${outputFile} (${articles.length} 篇)`);
