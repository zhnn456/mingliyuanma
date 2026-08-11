"""裁切文字区域并做高对比度分析"""
from PIL import Image, ImageEnhance

img_path = r"C:\Users\Administrator\Downloads\ScreenShot_2026-08-10_111012_621.png"
img = Image.open(img_path).convert('RGB')
w, h = img.size

# 根据之前的分析，定义关键区域
regions = {
    # 左侧栏区域
    "sidebar_top": (0, 0, 223, 150),
    "sidebar_mid": (0, 150, 223, 500),
    "sidebar_bottom": (0, 500, 223, 951),
    # 上部banner区域
    "banner": (223, 100, w, 280),
    # 主内容区各段
    "content_1": (223, 280, w, 427),
    "content_2": (223, 427, w, 570),
    "content_3": (223, 570, w, 760),
    "content_4": (223, 760, w, 903),
    "content_5": (223, 903, w, 951),
}

for name, box in regions.items():
    region = img.crop(box)
    # 增强对比度
    enhancer = ImageEnhance.Contrast(region)
    enhanced = enhancer.enhance(2.0)
    # 转灰度
    gray = enhanced.convert('L')
    # 统计亮暗像素
    pixels = list(gray.getdata())
    dark_count = sum(1 for p in pixels if p < 128)
    total = len(pixels)
    dark_pct = dark_count / total * 100

    # 检测是否有彩色（非灰色）内容
    rgb_pixels = list(region.getdata())
    colored = sum(1 for r, g, b in rgb_pixels if max(r,g,b) - min(r,g,b) > 40)
    colored_pct = colored / total * 100

    # 统计主色
    from collections import Counter
    color_counter = Counter()
    for r, g, b in rgb_pixels:
        r, g, b = (r//32)*32, (g//32)*32, (b//32)*32
        color_counter[(r,g,b)] += 1
    top3 = color_counter.most_common(3)
    top3_str = " ".join([f"#{r:02x}{g:02x}{b:02x}({cnt/total*100:.0f}%)" for (r,g,b), cnt in top3])

    print(f"[{name}] {box[2]-box[0]}x{box[3]-box[1]} dark={dark_pct:.1f}% colored={colored_pct:.1f}% top: {top3_str}")

# 检测左侧栏是否有导航菜单特征（等间距文字行）
print("\n=== 左侧栏纵向亮度变化（检测菜单项）===")
sidebar = img.crop((0, 0, 223, h)).convert('L')
prev_bright = 255
menu_items = []
for y in range(0, h, 2):
    row_pixels = [sidebar.getpixel((x, y)) for x in range(10, 220, 5)]
    avg = sum(row_pixels) / len(row_pixels)
    # 检测从亮到暗的变化（文字行开始）
    if prev_bright > 220 and avg < 200:
        menu_items.append(y)
    prev_bright = avg

# 聚类
if menu_items:
    clusters = [[menu_items[0]]]
    for y in menu_items[1:]:
        if y - clusters[-1][-1] < 15:
            clusters[-1].append(y)
        else:
            clusters.append([y])
    print(f"检测到 {len(clusters)} 个可能的文字行/菜单项:")
    for i, c in enumerate(clusters[:25]):
        avg_y = sum(c) // len(c)
        print(f"  行{i+1}: y={avg_y}")

# 检测banner区域的颜色渐变
print("\n=== Banner区域(x=223~1117, y=100~280)颜色渐变 ===")
banner = img.crop((223, 100, w, 280))
bw, bh = banner.size
for y in range(0, bh, 20):
    row_pixels = [banner.getpixel((x, y)) for x in range(0, bw, 10)]
    avg = tuple(sum(p[i] for p in row_pixels) // len(row_pixels) for i in range(3))
    hex_color = '#{:02x}{:02x}{:02x}'.format(*avg)
    # 检查是否渐变（比较左右两端）
    left = banner.getpixel((5, y))
    right = banner.getpixel((bw-5, y))
    diff = sum(abs(a-b) for a, b in zip(left, right))
    print(f"  y={100+y:3d} avg={hex_color} left={left} right={right} diff={diff}")
