/**
 * 命理知识系统 - 服务端 Markdown 渲染器
 * 用于生成对搜索引擎可见的静态 HTML 内容
 * 支持：标题、段落、列表、表格、代码块、图片、粗体、行内代码
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineFormat(text: string): string {
  // 行内代码
  let out = text.replace(/`([^`]+)`/g, (_m, code) => `<code class="bg-gray-100 text-red-700 px-1 rounded text-sm">${escapeHtml(code)}</code>`);
  // 粗体
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out;
}

export function markdownToHtml(content: string): string {
  const lines = content.split('\n');
  const html: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableAligns: ('left' | 'center' | 'right')[] = [];

  const flushList = () => {
    if (inList && listType) {
      const items = html.pop() || '';
      html.push(`<${listType} class="list-disc pl-6 space-y-1.5 mb-4">${items}</${listType}>`);
      inList = false;
      listType = null;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const header = tableRows[0];
      const body = tableRows.slice(1);
      let tableHtml = '<div class="overflow-x-auto my-6"><table class="min-w-full border-collapse text-sm">';
      tableHtml += '<thead><tr>';
      header.forEach((cell, i) => {
        const align = tableAligns[i] ? ` style="text-align:${tableAligns[i]}"` : '';
        tableHtml += `<th class="border border-gray-200 bg-gray-50 px-3 py-2 font-bold text-gray-800"${align}>${inlineFormat(cell.trim())}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';
      body.forEach(row => {
        tableHtml += '<tr>';
        row.forEach((cell, i) => {
          const align = tableAligns[i] ? ` style="text-align:${tableAligns[i]}"` : '';
          tableHtml += `<td class="border border-gray-200 px-3 py-2 text-gray-700"${align}>${inlineFormat(cell.trim())}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table></div>';
      html.push(tableHtml);
      inTable = false;
      tableRows = [];
      tableAligns = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // 代码块
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeBlockLines = [];
      } else {
        inCodeBlock = false;
        html.push(`<pre class="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4 text-sm leading-relaxed"><code>${escapeHtml(codeBlockLines.join('\n'))}</code></pre>`);
      }
      continue;
    }
    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // 表格（检测分隔行如 |---|）
    const tableSepMatch = line.match(/^\|?[\s:|-]+\|?$/);
    if (line.trim().startsWith('|') && tableSepMatch && line.includes('-')) {
      // 分隔行：提取对齐方式
      tableAligns = line.split('|').filter(c => c.trim() !== '').map(c => {
        const t = c.trim();
        if (t.startsWith(':') && t.endsWith(':')) return 'center';
        if (t.endsWith(':')) return 'right';
        if (t.startsWith(':')) return 'left';
        return 'left';
      });
      continue;
    }
    if (line.trim().startsWith('|')) {
      const cells = line.split('|').slice(1, -1);
      if (!inTable) {
        flushList();
        inTable = true;
        tableRows = [];
      }
      tableRows.push(cells);
      continue;
    }
    if (inTable && line.trim() !== '') {
      flushTable();
    }

    // 标题
    const h1 = line.match(/^## (.+)/);
    if (h1) {
      flushList(); flushTable();
      html.push(`<h2 id="${escapeHtml(h1[1].replace(/\s+/g, '-'))}" class="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-100 font-kai">${inlineFormat(h1[1])}</h2>`);
      continue;
    }
    const h2 = line.match(/^### (.+)/);
    if (h2) {
      flushList(); flushTable();
      html.push(`<h3 id="${escapeHtml(h2[1].replace(/\s+/g, '-'))}" class="text-xl font-bold text-gray-800 mt-6 mb-3 font-kai">${inlineFormat(h2[1])}</h3>`);
      continue;
    }
    const h3 = line.match(/^#### (.+)/);
    if (h3) {
      flushList(); flushTable();
      html.push(`<h4 id="${escapeHtml(h3[1].replace(/\s+/g, '-'))}" class="text-lg font-bold text-gray-800 mt-4 mb-2">${inlineFormat(h3[1])}</h4>`);
      continue;
    }

    // 图片
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      flushList(); flushTable();
      html.push(`<div class="my-6 text-center"><img src="${escapeHtml(img[2])}" alt="${escapeHtml(img[1])}" class="max-w-full rounded-xl shadow-md mx-auto" loading="lazy" /><p class="text-xs text-gray-400 mt-2">${escapeHtml(img[1])}</p></div>`);
      continue;
    }

    // 粗体行
    const boldLine = line.match(/^\*\*(.+)\*\*$/);
    if (boldLine) {
      flushList(); flushTable();
      html.push(`<p class="font-bold text-gray-800 mt-4 mb-2">${inlineFormat(boldLine[1])}</p>`);
      continue;
    }

    // 列表
    const ulItem = line.match(/^- (.+)/);
    if (ulItem) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
        html.push('');
      }
      html[html.length - 1] += `<li class="text-gray-700 leading-relaxed">${inlineFormat(ulItem[1])}</li>`;
      continue;
    }
    const olItem = line.match(/^\d+\. (.+)/);
    if (olItem) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
        html.push('');
      }
      html[html.length - 1] += `<li class="text-gray-700 leading-relaxed">${inlineFormat(olItem[1])}</li>`;
      continue;
    }

    // 空行
    if (line.trim() === '') {
      flushList(); flushTable();
      continue;
    }

    flushList(); flushTable();
    html.push(`<p class="text-gray-700 leading-relaxed mb-3">${inlineFormat(line)}</p>`);
  }

  flushList();
  flushTable();
  if (inCodeBlock) {
    html.push(`<pre class="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4 text-sm leading-relaxed"><code>${escapeHtml(codeBlockLines.join('\n'))}</code></pre>`);
  }

  return html.join('\n');
}

/** 提取目录（H2/H3） */
export function extractTOC(content: string): { id: string; title: string; level: number }[] {
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
