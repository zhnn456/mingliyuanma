from PIL import Image, ImageDraw, ImageFont
import math
import os

# Canvas size - A4 landscape
W, H = 2400, 1600
canvas = Image.new('RGB', (W, H), '#F5E6C8')
draw = ImageDraw.Draw(canvas)

# Try to load fonts
FONT_DIR = r"c:\Users\Administrator\.trae-cn\skills\canvas-design\canvas-fonts"

def load_font(name, size):
    paths = [
        os.path.join(FONT_DIR, f"{name}.ttf"),
        os.path.join(FONT_DIR, f"{name}-Regular.ttf"),
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                pass
    return ImageFont.load_default()

# Load fonts
font_serif_bold = load_font("IBMPlexSerif-Bold", 28)
font_serif = load_font("IBMPlexSerif-Regular", 18)
font_serif_sm = load_font("IBMPlexSerif-Regular", 13)
font_mono = load_font("JetBrainsMono-Regular", 12)
font_mono_sm = load_font("JetBrainsMono-Regular", 10)
font_display = load_font("YoungSerif-Regular", 42)
font_display_sm = load_font("YoungSerif-Regular", 24)
font_label = load_font("InstrumentSans-Regular", 14)
font_label_sm = load_font("InstrumentSans-Regular", 11)
font_bold = load_font("Outfit-Bold", 16)
font_title = load_font("YoungSerif-Regular", 32)

# Colors
VERMILION = "#9B2C2C"
VERMILION_DARK = "#7B1F1F"
GOLD = "#C9A962"
GOLD_DARK = "#A8893E"
INK_BLACK = "#1A1A2E"
INK_DARK = "#2D2D44"
RICE = "#F5E6C8"
RICE_DARK = "#E8D5A8"
CREAM = "#FAF0DC"
SEAL_RED = "#B22222"
GREEN = "#2D6A4F"
BLUE = "#1D3557"
PURPLE = "#5B2C6F"

# === BACKGROUND TEXTURE ===
# Create rice paper texture effect
for i in range(8000):
    x = (i * 137 + 19) % W
    y = (i * 239 + 53) % H
    alpha = 3 if (i % 7 == 0) else 1
    c = RICE_DARK
    draw.point((x, y), fill=c)

# Subtle grain
import random
random.seed(42)
for i in range(3000):
    x = random.randint(0, W-1)
    y = random.randint(0, H-1)
    c = random.choice(["#E8D5A8", "#E0CCA0", "#EDDDB5", "#F0DFC0"])
    draw.point((x, y), fill=c)

# === HEADER AREA ===
# Top bar
draw.rectangle([(0, 0), (W, 90)], fill=VERMILION_DARK)
# Gold accent line
draw.rectangle([(0, 88), (W, 92)], fill=GOLD)

# Seal/stamp in top right
seal_x, seal_y = W - 100, 45
draw.rectangle([(seal_x - 30, seal_y - 25), (seal_x + 30, seal_y + 25)], fill=SEAL_RED, outline=GOLD, width=2)
draw.text((seal_x - 18, seal_y - 12), "命理", fill="#FFD700", font=font_label)
draw.text((seal_x - 18, seal_y + 2), "玄鉴", fill="#FFD700", font=font_label)

# Title
draw.text((60, 25), "紫微斗数 · 命盘", fill=GOLD, font=font_display)
draw.text((62, 62), "ZI  WEI  DOU  SHU", fill=GOLD_DARK, font=font_label_sm)

# === NAV BAR ===
nav_y = 100
draw.rectangle([(0, nav_y), (W, nav_y + 45)], fill="#FAF0DC")
draw.rectangle([(0, nav_y + 43), (W, nav_y + 45)], fill=GOLD)

# View mode tabs
tabs = [("飞星盘", True), ("三合盘", False), ("四化盘", False)]
tab_x = 60
for label, active in tabs:
    if active:
        draw.rectangle([(tab_x, nav_y + 5), (tab_x + 120, nav_y + 38)], fill=VERMILION)
        draw.text((tab_x + 22, nav_y + 13), label, fill=CREAM, font=font_bold)
        draw.rectangle([(tab_x, nav_y + 38), (tab_x + 120, nav_y + 43)], fill=GOLD)
    else:
        draw.rectangle([(tab_x, nav_y + 5), (tab_x + 120, nav_y + 38)], fill=None, outline=INK_BLACK, width=1)
        draw.text((tab_x + 22, nav_y + 13), label, fill=INK_BLACK, font=font_label)
    tab_x += 140

# Time axis
draw.text((tab_x + 20, nav_y + 13), "时间维度", fill=INK_BLACK, font=font_label)
time_x = tab_x + 110
times = [("本命", True), ("大限", False), ("流年", False), ("流月", False)]
for label, active in times:
    if active:
        draw.rectangle([(time_x, nav_y + 8), (time_x + 65, nav_y + 35)], fill=INK_BLACK)
        draw.text((time_x + 15, nav_y + 14), label, fill=CREAM, font=font_label)
    else:
        draw.text((time_x + 15, nav_y + 14), label, fill=INK_DARK, font=font_label_sm)
    time_x += 75

# === CHART AREA ===
chart_x, chart_y = 60, 170
chart_size = 680
cell_size = chart_size // 4

# Chart background - rice paper with border
draw.rectangle([(chart_x - 12, chart_y - 12), (chart_x + chart_size + 12, chart_y + chart_size + 12)], fill="#FDF6E3", outline=VERMILION_DARK, width=3)
draw.rectangle([(chart_x - 8, chart_y - 8), (chart_x + chart_size + 8, chart_y + chart_size + 8)], fill=None, outline=GOLD, width=1)

# 12 palaces grid
palace_data = [
    # (branch_idx, name, stem, star1, star2, decadal_range, is_life, is_body)
    (0, "寅", "甲", "破军", "天相", "24-33", False, False),
    (1, "卯", "乙", "巨门", "", "34-43", False, False),
    (2, "辰", "丙", "太阴", "左辅", "44-53", False, False),
    (3, "巳", "丁", "贪狼", "右弼", "54-63", False, False),
    (4, "午", "戊", "紫微", "天府", "64-73", True, False),
    (5, "未", "己", "天机", "文昌", "74-83", False, False),
    (6, "申", "庚", "太阳", "文曲", "84-93", False, False),
    (7, "酉", "辛", "武曲", "", "94-103", False, False),
    (8, "戌", "壬", "天同", "天魁", "104-113", False, False),
    (9, "亥", "癸", "廉贞", "天钺", "114-123", False, True),
    (10, "子", "甲", "七杀", "", "124-133", False, False),
    (11, "丑", "乙", "禄存", "", "134-143", False, False),
]

# Grid positions: row,col (0-based for 4x4)
grid_positions = {
    0: (3, 0), 1: (2, 0), 2: (1, 0), 3: (0, 0),
    4: (0, 1), 5: (0, 2), 6: (0, 3),
    7: (1, 3), 8: (2, 3), 9: (3, 3),
    10: (3, 2), 11: (3, 1),
}

# Draw palaces
for p_idx, (_, name, stem, star1, star2, decadal, is_life, is_body) in enumerate(palace_data):
    row, col = grid_positions[p_idx]
    x0 = chart_x + col * cell_size
    y0 = chart_y + row * cell_size
    x1 = x0 + cell_size
    y1 = y0 + cell_size

    # Skip center (2x2)
    if row in [1, 2] and col in [1, 2]:
        continue

    # Palace background
    bg = "#FFFBF0"
    if is_life:
        bg = "#FFF3E0"
    elif is_body:
        bg = "#F0F4FF"
    draw.rectangle([(x0+2, y0+2), (x1-2, y1-2)], fill=bg, outline=RICE_DARK, width=1)

    # Palace header
    header_y = y0 + 10
    draw.text((x0 + 8, header_y), f"{stem}{name}", fill=INK_DARK, font=font_mono_sm)
    palace_name = name + "宫" if name not in ["命", "身"] else name
    color = VERMILION if is_life else INK_BLACK
    draw.text((x0 + 50, header_y - 2), palace_name, fill=color, font=font_bold)

    # Decadal
    if decadal:
        draw.text((x1 - 55, header_y), decadal, fill=GOLD_DARK, font=font_mono_sm)

    # Body marker
    if is_body:
        draw.rectangle([(x1 - 18, header_y - 2), (x1 - 8, header_y + 10)], fill=BLUE)
        draw.text((x1 - 15, header_y - 1), "身", fill=CREAM, font=font_mono_sm)

    # Stars
    star_y = header_y + 22
    if star1:
        star_color = VERMILION if is_life else INK_BLACK
        draw.text((x0 + 8, star_y), star1, fill=star_color, font=font_label)
    if star2:
        draw.text((x0 + 8, star_y + 18), star2, fill=INK_DARK, font=font_label_sm)

# Center palace (2x2)
cx0 = chart_x + cell_size
cy0 = chart_y + cell_size
cx1 = cx0 + cell_size * 2
cy1 = cy0 + cell_size * 2

draw.rectangle([(cx0+2, cy0+2), (cx1-2, cy1-2)], fill=VERMILION_DARK, outline=GOLD, width=2)
# Inner border
draw.rectangle([(cx0+6, cy0+6), (cx1-6, cy1-6)], fill=None, outline=GOLD, width=1)

# Center text
center_text_x = cx0 + cell_size
draw.text((center_text_x - 60, cy0 + 30), "紫微斗数", fill=GOLD, font=font_display_sm)
draw.text((center_text_x - 55, cy0 + 70), "ZI WEI DOU SHU", fill=GOLD_DARK, font=font_label_sm)

# Decorative line
draw.line([(center_text_x - 70, cy0 + 100), (center_text_x + 70, cy0 + 100)], fill=GOLD, width=1)

draw.text((center_text_x - 45, cy0 + 115), "水二局 · 木三局", fill=CREAM, font=font_label)

draw.text((center_text_x - 60, cy0 + 145), "命主 武曲", fill=GOLD, font=font_serif)
draw.text((center_text_x - 60, cy0 + 170), "身主 天机", fill="#87CEEB", font=font_serif)

draw.text((center_text_x - 40, cy0 + 200), "乾造 · 蛇年", fill=CREAM, font=font_label_sm)

# Four Transformations in center
sihua_items = [("廉贞禄", GREEN), ("破军权", BLUE), ("武曲科", PURPLE), ("太阳忌", "#B22222")]
for i, (label, color) in enumerate(sihua_items):
    bx = center_text_x - 60 + i * 32
    by = cy0 + 240
    draw.rectangle([(bx, by), (bx + 28, by + 20)], fill=color, outline=GOLD, width=1)
    draw.text((bx + 2, by + 3), label[:2], fill=CREAM, font=font_mono_sm)

# === FLYING STAR OVERLAY (SVG-like curves) ===
# Draw curves for flying star transformations
overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
odraw = ImageDraw.Draw(overlay)

# Calculate palace centers
palace_centers = {}
for p_idx, (_, _, _, _, _, _, _, _) in enumerate(palace_data):
    row, col = grid_positions[p_idx]
    cx = chart_x + col * cell_size + cell_size // 2
    cy = chart_y + row * cell_size + cell_size // 2
    palace_centers[p_idx] = (cx, cy)

# Draw flying star curves (curved paths)
flying_paths = [
    (0, 4, "#2D6A4F", "禄"),   # 寅 -> 午 化禄
    (4, 8, "#1D3557", "权"),   # 午 -> 戌 化权
    (8, 6, "#5B2C6F", "科"),   # 戌 -> 申 化科
    (6, 0, "#B22222", "忌"),   # 申 -> 寅 化忌
    (3, 7, "#2D6A4F", "禄"),
    (7, 11, "#1D3557", "权"),
    (11, 5, "#5B2C6F", "科"),
    (5, 3, "#B22222", "忌"),
]

for src, dst, color, label in flying_paths:
    sx, sy = palace_centers[src]
    dx, dy = palace_centers[dst]
    # Control point for curve
    mx = (sx + dx) / 2
    my = (sy + dy) / 2 - 40
    # Draw using many small line segments to approximate curve
    points = []
    for t in range(21):
        tt = t / 20.0
        px = (1-tt)**2 * sx + 2*(1-tt)*tt * mx + tt**2 * dx
        py = (1-tt)**2 * sy + 2*(1-tt)*tt * my + tt**2 * dy
        points.append((px, py))
    # Draw the curve
    for i in range(len(points) - 1):
        odraw.line([points[i], points[i+1]], fill=color, width=2)
    # Arrow head at destination
    if points:
        end = points[-1]
        angle = math.atan2(points[-1][1] - points[-2][1], points[-1][0] - points[-2][0])
        al = 8
        odraw.polygon([
            (end[0], end[1]),
            (end[0] - al * math.cos(angle - 0.4), end[1] - al * math.sin(angle - 0.4)),
            (end[0] - al * math.cos(angle + 0.4), end[1] - al * math.sin(angle + 0.4)),
        ], fill=color)

canvas = Image.alpha_composite(canvas.convert('RGBA'), overlay).convert('RGB')
draw = ImageDraw.Draw(canvas)

# Highlight selected palace (4 - 命宫)
selected_idx = 4
sr, sc = grid_positions[selected_idx]
sx0 = chart_x + sc * cell_size
sy0 = chart_y + sr * cell_size
draw.rectangle([(sx0+1, sy0+1), (sx0+cell_size-1, sy0+cell_size-1)], outline="#FFD700", width=3)

# === SIDE PANEL - Analysis ===
panel_x = chart_x + chart_size + 60
panel_y = 170
panel_w = W - panel_x - 60

# Panel title
draw.rectangle([(panel_x, panel_y), (panel_x + panel_w, panel_y + 50)], fill=VERMILION_DARK)
draw.text((panel_x + 20, panel_y + 12), "命盘综合解析", fill=GOLD, font=font_title)
draw.rectangle([(panel_x, panel_y + 50), (panel_x + panel_w, panel_y + 52)], fill=GOLD)

# Basic info section
info_y = panel_y + 70
draw.text((panel_x + 20, info_y), "基本信息", fill=VERMILION, font=font_bold)
draw.line([(panel_x + 20, info_y + 22), (panel_x + panel_w - 20, info_y + 22)], fill=RICE_DARK, width=1)

info_items = [
    ("农历", "1990年腊月初六午时"),
    ("四柱", "庚午 戊子 辛未 甲午"),
    ("五行局", "水二局 · 木三局"),
    ("生肖", "蛇"),
    ("命主", "武曲 · 天府"),
    ("身主", "天机 · 身宫亥"),
]
for i, (label, value) in enumerate(info_items):
    iy = info_y + 35 + i * 28
    draw.text((panel_x + 20, iy), label, fill=INK_DARK, font=font_label_sm)
    draw.text((panel_x + 80, iy), value, fill=INK_BLACK, font=font_label)

# Patterns section
pattern_y = info_y + 220
draw.text((panel_x + 20, pattern_y), "命盘格局", fill=VERMILION, font=font_bold)
draw.line([(panel_x + 20, pattern_y + 22), (panel_x + panel_w - 20, pattern_y + 22)], fill=RICE_DARK, width=1)

patterns = [
    ("禄马交驰格", "财运亨通 · 动中生财", GOLD_DARK),
    ("日月同宫格", "阴阳调和 · 艺术气质", BLUE),
    ("武府同宫格", "财库双全 · 最利求财", VERMILION),
]
for i, (name, desc, color) in enumerate(patterns):
    py = pattern_y + 35 + i * 45
    draw.rectangle([(panel_x + 20, py), (panel_x + panel_w - 20, py + 38)], fill="#FFFBF0", outline=color, width=1)
    draw.text((panel_x + 35, py + 8), name, fill=color, font=font_label)
    draw.text((panel_x + 35, py + 23), desc, fill=INK_DARK, font=font_label_sm)

# Si Hua section
sihua_y = pattern_y + 190
draw.text((panel_x + 20, sihua_y), "四化飞星", fill=VERMILION, font=font_bold)
draw.line([(panel_x + 20, sihua_y + 22), (panel_x + panel_w - 20, sihua_y + 22)], fill=RICE_DARK, width=1)

sihua_data = [
    ("廉贞", "化禄", "入命宫", GREEN, "主财运亨通，人缘佳"),
    ("破军", "化权", "入夫妻", BLUE, "主配偶有才能，感情主导"),
    ("武曲", "化科", "入官禄", PURPLE, "主事业有名望，利金融"),
    ("太阳", "化忌", "入迁移", "#B22222", "主外出劳碌，注意健康"),
]
for i, (star, mut, palace, color, desc) in enumerate(sihua_data):
    sy = sihua_y + 35 + i * 52
    # Color block
    draw.rectangle([(panel_x + 20, sy), (panel_x + 28, sy + 42)], fill=color)
    draw.text((panel_x + 35, sy + 2), f"{star}{mut}", fill=color, font=font_label)
    draw.text((panel_x + 130, sy + 2), f"入{palace}宫", fill=INK_DARK, font=font_label_sm)
    draw.text((panel_x + 35, sy + 22), desc, fill=INK_BLACK, font=font_label_sm)

# Decadal section
decadal_y = sihua_y + 250
draw.text((panel_x + 20, decadal_y), "大限运势", fill=VERMILION, font=font_bold)
draw.line([(panel_x + 20, decadal_y + 22), (panel_x + panel_w - 20, decadal_y + 22)], fill=RICE_DARK, width=1)

decadals = [
    ("24-33", "破军 · 天相", "财运亨通，事业起步", GREEN),
    ("34-43", "巨门", "口才得力，注意口舌", GOLD_DARK),
    ("44-53", "太阴 · 左辅", "稳健发展，财运累积", BLUE),
    ("54-63", "贪狼 · 右弼", "桃花旺盛，事业多变", PURPLE),
]
for i, (range_, stars, desc, color) in enumerate(decadals):
    dy = decadal_y + 35 + i * 45
    draw.rectangle([(panel_x + 20, dy), (panel_x + panel_w - 20, dy + 38)], fill="#FAF0DC", outline=RICE_DARK, width=1)
    draw.text((panel_x + 35, dy + 8), range_, fill=color, font=font_label)
    draw.text((panel_x + 90, dy + 8), stars, fill=INK_BLACK, font=font_label)
    draw.text((panel_x + 35, dy + 23), desc, fill=INK_DARK, font=font_label_sm)

# === BOTTOM SECTION - Palace details ===
bottom_y = chart_y + chart_size + 40
draw.rectangle([(60, bottom_y), (W - 60, bottom_y + 200)], fill="#FDF6E3", outline=VERMILION_DARK, width=2)

draw.text((80, bottom_y + 15), "十二宫逐一详析", fill=VERMILION, font=font_title)
draw.rectangle([(80, bottom_y + 50), (W - 80, bottom_y + 51)], fill=GOLD)

# Palace cards
card_w = (W - 160) // 4
palace_cards = [
    ("命宫", "紫微 · 天府", "庙旺", "帝王之气，领导才能出众", VERMILION),
    ("财帛", "武曲 · 文曲", "旺", "财库双全，正财运佳", GOLD_DARK),
    ("官禄", "贪狼 · 右弼", "得", "事业多变，利公关外交", BLUE),
    ("夫妻", "破军 · 天相", "平", "感情多变，需耐心经营", PURPLE),
]
for i, (name, stars, bright, desc, color) in enumerate(palace_cards):
    cx = 80 + i * card_w
    cy = bottom_y + 70
    # Card
    draw.rectangle([(cx, cy), (cx + card_w - 15, cy + 110)], fill=CREAM, outline=color, width=2)
    # Header
    draw.rectangle([(cx, cy), (cx + card_w - 15, cy + 28)], fill=color)
    draw.text((cx + 12, cy + 6), name, fill=CREAM, font=font_bold)
    # Content
    draw.text((cx + 12, cy + 38), stars, fill=INK_BLACK, font=font_label)
    draw.text((cx + 12, cy + 56), f"亮度：{bright}", fill=GOLD_DARK, font=font_label_sm)
    # Description
    draw.text((cx + 12, cy + 74), desc, fill=INK_DARK, font=font_label_sm)

# === FOOTER ===
footer_y = H - 50
draw.rectangle([(0, footer_y), (W, H)], fill=VERMILION_DARK)
draw.rectangle([(0, footer_y), (W, footer_y + 3)], fill=GOLD)
draw.text((60, footer_y + 18), "命理玄鉴 · 传承智慧 · 启迪人生", fill=GOLD, font=font_label)
draw.text((W - 200, footer_y + 18), "bazi6.cc.cd", fill=GOLD_DARK, font=font_mono)

# === DECORATIVE ELEMENTS ===
# Corner seal
seal_x, seal_y = 40, H - 100
draw.rectangle([(seal_x, seal_y), (seal_x + 55, seal_y + 55)], fill=SEAL_RED, outline=GOLD, width=2)
draw.text((seal_x + 15, seal_y + 8), "命理", fill="#FFD700", font=font_label_sm)
draw.text((seal_x + 15, seal_y + 22), "玄鉴", fill="#FFD700", font=font_label_sm)
draw.text((seal_x + 15, seal_y + 36), "之印", fill="#FFD700", font=font_label_sm)

# Save
output_path = r"f:\mingliyuanma\ziwei-design.png"
canvas.save(output_path, "PNG", quality=95)
print(f"Design saved to {output_path}")
