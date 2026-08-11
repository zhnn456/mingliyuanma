# -*- coding: utf-8 -*-
"""
软著源代码文档生成脚本
提取项目前60页（3000行）+ 后60页（3000行）源代码
生成可被Word打开的HTML文档
"""
import os
import sys

# ============== 配置 ==============
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINES_PER_PAGE = 50          # 每页50行
PAGES_PER_PART = 60          # 前60页 + 后60页
LINES_PER_PART = LINES_PER_PAGE * PAGES_PER_PART  # 3000行

# 需要收集的文件扩展名
VALID_EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.css', '.sql', '.py'}

# 需要排除的目录
EXCLUDE_DIRS = {
    'node_modules', '.next', '.git', 'public', 'deploy-root',
    'deploy-tmp', 'deploy-assets', 'dist', 'build', 'coverage',
    '.trae', 'docs', '.vscode', 'tests'
}

# 需要排除的文件名模式
EXCLUDE_FILES = {
    '.eslintrc.js', 'next.config.js', 'postcss.config.js',
    'tailwind.config.js', 'version-inject.js', 'restore-d1-to-mysql.py',
    'generate-source-doc.py'
}

# 收集目录（按优先级排序）
COLLECT_DIRS = ['src', 'scripts']


def should_exclude_dir(dirpath):
    """检查目录是否应该排除"""
    parts = dirpath.replace('\\', '/').split('/')
    for part in parts:
        if part in EXCLUDE_DIRS:
            return True
    return False


def should_include_file(filename):
    """检查文件是否应该包含"""
    if filename in EXCLUDE_FILES:
        return False
    _, ext = os.path.splitext(filename)
    return ext in VALID_EXTENSIONS


def collect_source_files():
    """收集所有源代码文件"""
    files = []
    for collect_dir in COLLECT_DIRS:
        dir_path = os.path.join(PROJECT_ROOT, collect_dir)
        if not os.path.exists(dir_path):
            continue
        for root, dirs, filenames in os.walk(dir_path):
            # 排除目录
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for filename in filenames:
                if should_include_file(filename):
                    full_path = os.path.join(root, filename)
                    rel_path = os.path.relpath(full_path, PROJECT_ROOT)
                    files.append((rel_path.replace('\\', '/'), full_path))

    # 按相对路径排序
    files.sort(key=lambda x: x[0])
    return files


def read_file_lines(filepath):
    """读取文件内容，返回行列表"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
        # 去掉换行符
        return [line.rstrip('\n').rstrip('\r') for line in lines]
    except Exception as e:
        return [f'// 读取文件失败: {e}']


def collect_all_lines(files):
    """收集所有代码行，带文件标记"""
    all_lines = []
    for rel_path, full_path in files:
        lines = read_file_lines(full_path)
        # 添加文件分隔标记
        all_lines.append(f'// ===== 文件: {rel_path} =====')
        all_lines.append(f'// 共 {len(lines)} 行')
        all_lines.append('')
        all_lines.extend(lines)
        all_lines.append('')  # 文件间空行
    return all_lines


def escape_html(text):
    """转义HTML特殊字符"""
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    return text


def generate_html(front_lines, back_lines, total_lines, total_files):
    """生成HTML文档"""
    html_parts = []
    html_parts.append(f'''<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>先知命理网系统 V4.0.0 源代码文档</title>
<style>
@page Section1 {{
  size: 595.3pt 841.9pt;
  margin: 2.54cm 3.17cm 2.54cm 3.17cm;
  mso-header-margin: 1.5cm;
  mso-footer-margin: 1.75cm;
  mso-page-orientation: portrait;
}}
@page Section1:first {{
  mso-header-margin: 1.5cm;
}}
div.Section1 {{ page: Section1; }}
body {{
  font-family: "Courier New", "宋体", monospace;
  font-size: 9pt;
  line-height: 1.4;
  color: #000;
}}
.cover {{
  text-align: center;
  page-break-after: always;
  padding-top: 120pt;
}}
.cover h1 {{
  font-size: 26pt;
  font-family: "黑体", SimHei, sans-serif;
  margin: 0 0 16pt;
}}
.cover h2 {{
  font-size: 18pt;
  font-family: "黑体", SimHei, sans-serif;
  margin: 8pt 0;
  border: none;
}}
.cover .info {{
  margin-top: 50pt;
  font-size: 12pt;
  font-family: "宋体", SimSun, serif;
  line-height: 2.5;
}}
.code-block {{
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: "Courier New", monospace;
  font-size: 8pt;
  line-height: 1.35;
}}
.code-block .file-header {{
  font-weight: bold;
  color: #0000ff;
  font-family: "宋体", SimSun, serif;
  font-size: 9pt;
}}
.section-title {{
  font-family: "黑体", SimHei, sans-serif;
  font-size: 14pt;
  text-align: center;
  margin: 20pt 0 10pt;
  border-bottom: 1pt solid #000;
  padding-bottom: 4pt;
}}
p.no-indent {{
  text-indent: 0;
  margin: 2pt 0;
}}
.page-break {{
  page-break-before: always;
}}
</style>
</head>
<body>
<div class="Section1">

<!-- 封面 -->
<div class="cover">
  <h1>先知命理网系统</h1>
  <h2>V4.0.0</h2>
  <h2>源代码文档</h2>
  <div class="info">
    <p class="no-indent">软件名称：先知命理网系统</p>
    <p class="no-indent">软件简称：先知命理网</p>
    <p class="no-indent">版本号：V4.0.0</p>
    <p class="no-indent">著作权人：_______________</p>
    <p class="no-indent">源代码总行数：{total_lines} 行</p>
    <p class="no-indent">源代码文件数：{total_files} 个</p>
    <p class="no-indent">本文档包含：前60页 + 后60页源代码</p>
  </div>
</div>

<!-- 前半部分 -->
<div class="page-break">
  <div class="section-title">源代码（前半部分）</div>
  <div class="code-block">
''')

    # 前半部分代码
    for i, line in enumerate(front_lines):
        escaped = escape_html(line)
        if escaped.startswith('// ===== 文件:'):
            html_parts.append(f'<span class="file-header">{escaped}</span>\n')
        else:
            html_parts.append(escaped + '\n')

    html_parts.append(f'''  </div>
</div>

<!-- 后半部分 -->
<div class="page-break">
  <div class="section-title">源代码（后半部分）</div>
  <div class="code-block">
''')

    # 后半部分代码
    for i, line in enumerate(back_lines):
        escaped = escape_html(line)
        if escaped.startswith('// ===== 文件:'):
            html_parts.append(f'<span class="file-header">{escaped}</span>\n')
        else:
            html_parts.append(escaped + '\n')

    html_parts.append('''  </div>
</div>

</div>
</body>
</html>
''')

    return ''.join(html_parts)


def main():
    print("=" * 60)
    print("软著源代码文档生成器")
    print("=" * 60)

    # 1. 收集文件
    print("\n[1/4] 收集源代码文件...")
    files = collect_source_files()
    print(f"  共找到 {len(files)} 个源代码文件")

    # 2. 读取所有行
    print("\n[2/4] 读取源代码内容...")
    all_lines = collect_all_lines(files)
    total_lines = len(all_lines)
    print(f"  源代码总行数: {total_lines} 行")

    # 3. 提取前60页和后60页
    print("\n[3/4] 提取前60页 + 后60页代码...")
    if total_lines <= LINES_PER_PART * 2:
        # 代码总量不足6000行，全部输出
        print(f"  代码总量不足 {LINES_PER_PART * 2} 行，输出全部代码")
        front_lines = all_lines
        back_lines = []
    else:
        front_lines = all_lines[:LINES_PER_PART]
        back_lines = all_lines[-LINES_PER_PART:]
        print(f"  前60页: 第 1 ~ {LINES_PER_PART} 行")
        print(f"  后60页: 第 {total_lines - LINES_PER_PART + 1} ~ {total_lines} 行")

    # 4. 生成HTML
    print("\n[4/4] 生成HTML文档...")
    html = generate_html(front_lines, back_lines, total_lines, len(files))

    # 统计实际页数
    front_pages = (len(front_lines) + LINES_PER_PAGE - 1) // LINES_PER_PAGE
    back_pages = (len(back_lines) + LINES_PER_PAGE - 1) // LINES_PER_PAGE
    total_pages = front_pages + back_pages
    print(f"  前半部分: {front_pages} 页 ({len(front_lines)} 行)")
    print(f"  后半部分: {back_pages} 页 ({len(back_lines)} 行)")
    print(f"  总计: {total_pages} 页")

    # 保存文件
    output_path = os.path.join(PROJECT_ROOT, 'docs', '源代码文档_先知命理网V4.0.0.html')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"\n{'=' * 60}")
    print(f"文档已生成: {output_path}")
    print(f"{'=' * 60}")
    print(f"\n使用方法:")
    print(f"  1. 用 Word 打开该 HTML 文件")
    print(f"  2. 另存为 .docx 格式")
    print(f"  3. 检查页眉页脚（可添加软件名称和页码）")
    print(f"\n统计信息:")
    print(f"  源代码文件数: {len(files)}")
    print(f"  源代码总行数: {total_lines}")
    print(f"  文档页数: {total_pages} 页")


if __name__ == '__main__':
    main()
