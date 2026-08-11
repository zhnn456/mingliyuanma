"""深度分析截图：文字区域检测、卡片边界、布局结构"""
from PIL import Image
import collections
import math

img_path = r"C:\Users\Administrator\Downloads\ScreenShot_2026-08-10_111012_621.png"
img = Image.open(img_path).convert('RGB')
w, h = img.size
print(f"尺寸: {w}x{h}")

# 1. 精细区域分析 - 10x10网格
print("\n=== 10x10 网格颜色分析 ===")
grid_w, grid_h = w // 10, h // 10
grid_colors = []
for gy in range(10):
    row = []
    for gx in range(10):
        x1, y1 = gx * grid_w, gy * grid_h
        x2, y2 = x1 + grid_w, y1 + grid_h
        region = img.crop((x1, y1, x2, y2))
        # 计算平均色
        pixels = list(region.getdata())
        avg_r = sum(p[0] for p in pixels) // len(pixels)
        avg_g = sum(p[1] for p in pixels) // len(pixels)
        avg_b = sum(p[2] for p in pixels) // len(pixels)
        # 计算方差（判断是否有文字/内容）
        variance = sum((p[0]-avg_r)**2 + (p[1]-avg_g)**2 + (p[2]-avg_b)**2 for p in pixels) / len(pixels)
        variance = int(variance)
        hex_color = '#{:02x}{:02x}{:02x}'.format(avg_r, avg_g, avg_b)
        brightness = (avg_r + avg_g + avg_b) / 3
        has_content = "[*]" if variance > 500 else " . "
        row.append((hex_color, brightness, variance, has_content))
        grid_colors.append((gx, gy, hex_color, brightness, variance))
    # 打印每行
    line = ""
    for hc, br, var, hc_icon in row:
        line += f"{hc_icon}{hc}"
    print(f"  y{gy}: {line}")

# 2. 检测文字密集区域（高方差区域）
print("\n=== 高方差区域（可能包含文字/内容）===")
text_regions = [(gx, gy, hex_color, var) for gx, gy, hex_color, _, var in grid_colors if var > 500]
for gx, gy, hc, var in text_regions:
    print(f"  网格({gx},{gy}) 颜色={hc} 方差={var}")

# 3. 检测卡片/区块边界（检测颜色突变）
print("\n=== 水平颜色突变（检测卡片/区块边界）===")
prev_color = None
for gy in range(20):
    y = gy * h // 20
    # 采样整行的颜色
    pixels = [img.getpixel((x, y)) for x in range(0, w, max(1, w//100))]
    avg = tuple(sum(p[i] for p in pixels) // len(pixels) for i in range(3))
    hex_color = '#{:02x}{:02x}{:02x}'.format(*avg)
    if prev_color:
        diff = sum(abs(a-b) for a, b in zip(avg, prev_color))
        if diff > 30:
            print(f"  y={y:4d} {prev_hex} -> {hex_color} (差值={diff})")
    prev_color = avg
    prev_hex = hex_color

# 4. 检测垂直颜色突变（检测左右分栏）
print("\n=== 垂直颜色突变（检测左右分栏）===")
prev_color = None
for gx in range(20):
    x = gx * w // 20
    pixels = [img.getpixel((x, y)) for y in range(0, h, max(1, h//100))]
    avg = tuple(sum(p[i] for p in pixels) // len(pixels) for i in range(3))
    hex_color = '#{:02x}{:02x}{:02x}'.format(*avg)
    if prev_color:
        diff = sum(abs(a-b) for a, b in zip(avg, prev_color))
        if diff > 30:
            print(f"  x={x:4d} {prev_hex} -> {hex_color} (差值={diff})")
    prev_color = avg
    prev_hex = hex_color

# 5. 分析上部10-30%区域（有青色的banner区）
print("\n=== 上部区域精细分析 (y=100~280) ===")
banner_region = img.crop((0, 100, w, 280))
banner_colors = collections.Counter()
for y in range(0, 180, 3):
    for x in range(0, w, 3):
        r, g, b = banner_region.getpixel((x, y))
        r, g, b = (r // 16) * 16, (g // 16) * 16, (b // 16) * 16
        banner_colors[(r, g, b)] += 1
print("上部区域主色:")
for color, count in banner_colors.most_common(10):
    pct = count / sum(banner_colors.values()) * 100
    hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
    print(f"  {hex_color} — {pct:.1f}%")

# 6. 分析强调色（非灰色系的颜色）
print("\n=== 强调色（非灰色系）===")
all_colors = collections.Counter()
for y in range(0, h, 2):
    for x in range(0, w, 2):
        r, g, b = img.getpixel((x, y))
        # 判断是否为彩色（非灰色）
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        if max_c - min_c > 40:  # 彩色
            r, g, b = (r // 32) * 32, (g // 32) * 32, (b // 32) * 32
            all_colors[(r, g, b)] += 1
print("彩色像素分布:")
for color, count in all_colors.most_common(15):
    pct = count / sum(all_colors.values()) * 100
    hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
    # 判断色系
    r, g, b = color
    if g > r and g > b:
        hue = "绿色系"
    elif r > g and r > b:
        hue = "红色系"
    elif b > r and b > g:
        hue = "蓝色系"
    elif r > 150 and g > 150 and b < 100:
        hue = "黄色系"
    elif g > 150 and r > 100 and b < 100:
        hue = "黄绿系"
    elif b > 150 and g > 100 and r < 100:
        hue = "青色系"
    else:
        hue = "其他"
    print(f"  {hex_color} — {pct:.1f}% ({hue})")

# 7. 底部区域分析
print("\n=== 底部区域 (y=850~951) ===")
bottom = img.crop((0, 850, w, h))
bottom_colors = collections.Counter()
for y in range(0, h-850, 2):
    for x in range(0, w, 2):
        r, g, b = bottom.getpixel((x, y))
        r, g, b = (r // 32) * 32, (g // 32) * 32, (b // 32) * 32
        bottom_colors[(r, g, b)] += 1
print("底部主色:")
for color, count in bottom_colors.most_common(5):
    pct = count / sum(bottom_colors.values()) * 100
    hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
    print(f"  {hex_color} — {pct:.1f}%")
