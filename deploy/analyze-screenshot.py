"""分析截图的颜色、布局和文字"""
from PIL import Image
import collections

img_path = r"C:\Users\Administrator\Downloads\ScreenShot_2026-08-10_111012_621.png"
img = Image.open(img_path)
print(f"图片尺寸: {img.size}")
print(f"图片模式: {img.mode}")

# 转RGB
img_rgb = img.convert('RGB')
w, h = img.size

# 1. 分析主色调（采样）
colors = collections.Counter()
for y in range(0, h, max(1, h // 200)):
    for x in range(0, w, max(1, w // 200)):
        r, g, b = img_rgb.getpixel((x, y))
        # 量化到 32 级
        r, g, b = (r // 32) * 32, (g // 32) * 32, (b // 32) * 32
        colors[(r, g, b)] += 1

print("\n=== 主色调 TOP 15 ===")
for color, count in colors.most_common(15):
    pct = count / sum(colors.values()) * 100
    hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
    # 判断明暗
    brightness = (color[0] + color[1] + color[2]) / 3
    tone = "深色" if brightness < 128 else "浅色"
    print(f"  {hex_color} RGB{color} — {pct:.1f}% ({tone})")

# 2. 分析顶部、中部、底部颜色（判断布局）
print("\n=== 区域颜色分析 ===")
regions = [
    ("顶部 0-10%", (0, int(h*0.0), w, int(h*0.1))),
    ("上部 10-30%", (0, int(h*0.1), w, int(h*0.3))),
    ("中部 30-60%", (0, int(h*0.3), w, int(h*0.6))),
    ("下部 60-80%", (0, int(h*0.6), w, int(h*0.8))),
    ("底部 80-100%", (0, int(h*0.8), w, int(h*1.0))),
]
for name, box in regions:
    region = img_rgb.crop(box)
    region_colors = collections.Counter()
    rw, rh = region.size
    for y in range(0, rh, max(1, rh // 100)):
        for x in range(0, rw, max(1, rw // 100)):
            r, g, b = region.getpixel((x, y))
            r, g, b = (r // 32) * 32, (g // 32) * 32, (b // 32) * 32
            region_colors[(r, g, b)] += 1
    top3 = region_colors.most_common(3)
    top_hex = [('#{:02x}{:02x}{:02x}'.format(*c), f'{cnt/sum(region_colors.values())*100:.0f}%') for c, cnt in top3]
    print(f"  {name}: {top_hex}")

# 3. 分析左右分栏（判断是否左右布局）
print("\n=== 左右分栏分析 ===")
left_half = img_rgb.crop((0, 0, w//2, h))
right_half = img_rgb.crop((w//2, 0, w, h))

for name, region in [("左半区", left_half), ("右半区", right_half)]:
    region_colors = collections.Counter()
    rw, rh = region.size
    for y in range(0, rh, max(1, rh // 150)):
        for x in range(0, rw, max(1, rw // 150)):
            r, g, b = region.getpixel((x, y))
            r, g, b = (r // 32) * 32, (g // 32) * 32, (b // 32) * 32
            region_colors[(r, g, b)] += 1
    top5 = region_colors.most_common(5)
    top_hex = [('#{:02x}{:02x}{:02x}'.format(*c), f'{cnt/sum(region_colors.values())*100:.0f}%') for c, cnt in top5]
    print(f"  {name}: {top_hex}")

# 4. 尝试OCR
print("\n=== OCR 文字识别 ===")
try:
    import pytesseract
    # 尝试中文
    text = pytesseract.image_to_string(img_rgb, lang='chi_sim+eng')
    print("识别到的文字:")
    print(text[:3000] if text.strip() else "(未识别到文字)")
except Exception as e:
    print(f"OCR不可用: {e}")
    # 备选：分析亮暗区域推测布局
    print("\n=== 备选：亮暗分布分析 ===")
    gray = img.convert('L')
    # 分析纵向亮暗变化（检测水平分割线/区块）
    row_brightness = []
    for y in range(0, h, max(1, h//50)):
        row_pixels = [gray.getpixel((x, y)) for x in range(0, w, max(1, w//50))]
        avg = sum(row_pixels) / len(row_pixels)
        row_brightness.append((y, avg))
    
    print("纵向亮度分布（检测水平区块）:")
    for y, brightness in row_brightness:
        bar = '█' * int(brightness / 10)
        print(f"  y={y:4d} 亮度={brightness:6.1f} {bar}")

# 5. 检测边缘（判断卡片/边框）
print("\n=== 边缘检测（判断卡片布局）===")
gray = img.convert('L')
import numpy as np
arr = np.array(gray)
# 检测水平亮线（可能是分割线或卡片边界）
row_diff = np.abs(np.diff(arr.astype(int), axis=0))
row_edge = np.mean(row_diff, axis=1)
edge_rows = np.where(row_edge > 30)[0]  # 有明显水平边缘的行
if len(edge_rows) > 0:
    # 聚类
    clusters = []
    current = [edge_rows[0]]
    for r in edge_rows[1:]:
        if r - current[-1] < 20:
            current.append(r)
        else:
            clusters.append(current)
            current = [r]
    clusters.append(current)
    print(f"检测到 {len(clusters)} 个水平边缘区域:")
    for i, c in enumerate(clusters[:20]):
        avg_y = sum(c) // len(c)
        print(f"  边缘{i+1}: y={avg_y} (范围 {c[0]}-{c[-1]})")
