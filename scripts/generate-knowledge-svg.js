// 生成传统文化知识图解 SVG（古风风格，可商用）
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'images', 'knowledge');
const FONT = 'font-family="KaiTi, STKaiti, SimSun, serif"';
const GOLD = '#b8860b';
const RED = '#8b0000';
const INK = '#2d2d2d';
const GREEN = '#4a6741';
const BLUE = '#2f4f6f';
const BG = '#faf6ef';

function save(cat, name, svg) {
  const dir = path.join(OUT, cat);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), svg);
  console.log('✅', cat + '/' + name);
}

// ========== 1. 五行相生相克环图 ==========
function wuxing() {
  const cx = 300, cy = 250, R = 160, r = 70;
  const items = ['木', '火', '土', '金', '水'];
  const colors = ['#4a6741', '#b04a2f', '#b8860b', '#7a8a99', '#2f4f6f'];
  const pos = items.map((_, i) => {
    const ang = -90 + i * 72;
    const rad = ang * Math.PI / 180;
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  });
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="500" viewBox="0 0 600 500" style="background:${BG}">`;
  s += `<text x="300" y="36" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">五行相生相克图</text>`;
  s += `<text x="300" y="58" text-anchor="middle" font-size="13" ${FONT} fill="#888">相生：木→火→土→金→水→木　|　相克：木→土→水→火→金→木</text>`;
  // 相生箭头（外圈顺时针）
  for (let i = 0; i < 5; i++) {
    const a = pos[i], b = pos[(i + 1) % 5];
    s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#c8a24a" stroke-width="3" marker-end="url(#arr)"/>`;
  }
  // 相克线（五角星）
  const star = [0, 2, 4, 1, 3];
  for (let i = 0; i < 5; i++) {
    const a = pos[star[i]], b = pos[star[(i + 1) % 5]];
    s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#c0392b" stroke-width="1.6" stroke-dasharray="6 4" opacity="0.75"/>`;
  }
  s += `<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#c8a24a"/></marker></defs>`;
  // 元素圆
  items.forEach((it, i) => {
    const p = pos[i];
    s += `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${colors[i]}" opacity="0.12"/>`;
    s += `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="2"/>`;
    s += `<text x="${p.x}" y="${p.y - 14}" text-anchor="middle" font-size="34" ${FONT} fill="${colors[i]}">${it}</text>`;
    s += `<text x="${p.x}" y="${p.y + 18}" text-anchor="middle" font-size="12" ${FONT} fill="${INK}">${['东方·春季','南方·夏季','中央·长夏','西方·秋季','北方·冬季'][i]}</text>`;
  });
  s += `<text x="300" y="470" text-anchor="middle" font-size="12" ${FONT} fill="#999">实线箭头为相生，虚线为相克；五行相生相克是传统文化认识世界的基本框架</text>`;
  s += `</svg>`;
  save('basic', 'wuxing.svg', s);
}

// ========== 2. 天干地支对照表 ==========
function ganzhi() {
  const gans = [['甲','木·阳'],['乙','木·阴'],['丙','火·阳'],['丁','火·阴'],['戊','土·阳'],['己','土·阴'],['庚','金·阳'],['辛','金·阴'],['壬','水·阳'],['癸','水·阴']];
  const zhis = [['子','鼠','23-1时'],['丑','牛','1-3时'],['寅','虎','3-5时'],['卯','兔','5-7时'],['辰','龙','7-9时'],['巳','蛇','9-11时'],['午','马','11-13时'],['未','羊','13-15时'],['申','猴','15-17时'],['酉','鸡','17-19时'],['戌','狗','19-21时'],['亥','猪','21-23时']];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="620" style="background:${BG}">`;
  s += `<text x="400" y="36" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">天干地支对照表</text>`;
  // 天干
  s += `<text x="30" y="76" font-size="16" ${FONT} fill="${INK}" font-weight="bold">十天干</text>`;
  gans.forEach((g, i) => {
    const x = 30 + i * 74;
    s += `<rect x="${x}" y="90" width="68" height="64" rx="8" fill="${i % 2 ? '#fdf6e3' : '#f5e9d0'}" stroke="#d4b878"/>`;
    s += `<text x="${x + 34}" y="118" text-anchor="middle" font-size="24" ${FONT} fill="${INK}">${g[0]}</text>`;
    s += `<text x="${x + 34}" y="140" text-anchor="middle" font-size="11" ${FONT} fill="#888">${g[1]}</text>`;
  });
  // 地支
  s += `<text x="30" y="190" font-size="16" ${FONT} fill="${INK}" font-weight="bold">十二地支 · 生肖 · 时辰</text>`;
  zhis.forEach((z, i) => {
    const x = 30 + (i % 6) * 124;
    const y = 204 + Math.floor(i / 6) * 96;
    s += `<rect x="${x}" y="${y}" width="118" height="84" rx="8" fill="${i % 2 ? '#fdf6e3' : '#f5e9d0'}" stroke="#d4b878"/>`;
    s += `<text x="${x + 20}" y="${y + 34}" font-size="26" ${FONT} fill="${INK}">${z[0]}</text>`;
    s += `<text x="${x + 70}" y="${y + 30}" font-size="20" ${FONT} fill="${RED}">${z[1]}</text>`;
    s += `<text x="${x + 70}" y="${y + 54}" font-size="12" ${FONT} fill="#888">${z[2]}</text>`;
    s += `<text x="${x + 20}" y="${y + 62}" font-size="11" ${FONT} fill="#999">${['子月','丑月','寅月','卯月','辰月','巳月','午月','未月','申月','酉月','戌月','亥月'][i]}</text>`;
  });
  s += `<text x="400" y="600" text-anchor="middle" font-size="12" ${FONT} fill="#999">天干地支纪年法以六十甲子循环，是传统历法的核心骨架</text>`;
  s += `</svg>`;
  save('basic', 'ganzhi.svg', s);
}

// ========== 3. 二十四节气环图 ==========
function jieqi() {
  const names = ['立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至','小寒','大寒'];
  const colors = ['#4a6741','#4a6741','#4a6741','#4a6741','#4a6741','#4a6741','#b04a2f','#b04a2f','#b04a2f','#b04a2f','#b04a2f','#b04a2f','#b8860b','#b8860b','#b8860b','#b8860b','#b8860b','#b8860b','#2f4f6f','#2f4f6f','#2f4f6f','#2f4f6f','#2f4f6f','#2f4f6f'];
  const seasons = ['春','春','春','春','春','春','夏','夏','夏','夏','夏','夏','秋','秋','秋','秋','秋','秋','冬','冬','冬','冬','冬','冬'];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="620" style="background:${BG}">`;
  s += `<text x="300" y="36" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">二十四节气环图</text>`;
  s += `<text x="300" y="58" text-anchor="middle" font-size="13" ${FONT} fill="#888">始于立春，终于大寒，每 15 天一个节气</text>`;
  const cx = 300, cy = 320, R1 = 230, R2 = 160;
  names.forEach((n, i) => {
    const ang = -90 + i * 15;
    const rad = ang * Math.PI / 180;
    const x1 = cx + R1 * Math.cos(rad), y1 = cy + R1 * Math.sin(rad);
    const x2 = cx + R2 * Math.cos(rad), y2 = cy + R2 * Math.sin(rad);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colors[i]}" stroke-width="1.5" opacity="0.8"/>`;
    // 节点
    const big = i % 2 === 0;
    s += `<circle cx="${x1}" cy="${y1}" r="${big ? 7 : 5}" fill="${colors[i]}" stroke="#fff" stroke-width="1.5"/>`;
    // 标签（奇数节气在外侧）
    const lr = R1 + (big ? 26 : 20);
    const lx = cx + lr * Math.cos(rad), ly = cy + lr * Math.sin(rad) + 5;
    s += `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="${big ? 14 : 12}" ${FONT} fill="${colors[i]}">${n}</text>`;
    // 季节标记
    if (i % 6 === 0) {
      const mx = cx + (R1 + 46) * Math.cos(rad), my = cy + (R1 + 46) * Math.sin(rad);
      s += `<text x="${mx}" y="${my}" text-anchor="middle" font-size="18" ${FONT} fill="${colors[i]}" font-weight="bold">${seasons[i]}</text>`;
    }
  });
  s += `<text x="300" y="585" text-anchor="middle" font-size="12" ${FONT} fill="#999">节气的确立与太阳黄经相关，反映气候与物候变化，2016 年入选联合国教科文组织非遗名录</text>`;
  s += `</svg>`;
  save('basic', 'jieqi.svg', s);
}

// ========== 4. 十二生肖表 ==========
function shengxiao() {
  const animals = [['鼠','子','23-1时'],['牛','丑','1-3时'],['虎','寅','3-5时'],['兔','卯','5-7时'],['龙','辰','7-9时'],['蛇','巳','9-11时'],['马','午','11-13时'],['羊','未','13-15时'],['猴','申','15-17时'],['鸡','酉','17-19时'],['狗','戌','19-21时'],['猪','亥','21-23时']];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="460" style="background:${BG}">`;
  s += `<text x="380" y="36" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">十二生肖与地支时辰</text>`;
  animals.forEach((a, i) => {
    const x = 40 + (i % 4) * 178;
    const y = 60 + Math.floor(i / 4) * 128;
    s += `<rect x="${x}" y="${y}" width="168" height="112" rx="10" fill="${i % 2 ? '#fdf6e3' : '#f5e9d0'}" stroke="#d4b878"/>`;
    s += `<text x="${x + 84}" y="${y + 40}" text-anchor="middle" font-size="38" ${FONT} fill="${INK}">${a[0]}</text>`;
    s += `<text x="${x + 84}" y="${y + 72}" text-anchor="middle" font-size="14" ${FONT} fill="${RED}">地支「${a[1]}」</text>`;
    s += `<text x="${x + 84}" y="${y + 96}" text-anchor="middle" font-size="12" ${FONT} fill="#888">${a[2]}</text>`;
  });
  s += `</svg>`;
  save('basic', 'shengxiao.svg', s);
}

// ========== 5. 四柱结构图 ==========
function sizhu() {
  const cols = [['年柱','甲','子','2024 甲辰年'],['月柱','丙','寅','2 月立春后'],['日柱','戊','辰','出生当日'],['时柱','庚','申','出生时辰']];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="360" style="background:${BG}">`;
  s += `<text x="380" y="36" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">四柱八字结构示例</text>`;
  s += `<text x="380" y="58" text-anchor="middle" font-size="13" ${FONT} fill="#888">年柱 · 月柱 · 日柱 · 时柱，每柱天干+地支，共八个字</text>`;
  cols.forEach((c, i) => {
    const x = 60 + i * 170;
    s += `<rect x="${x}" y="80" width="150" height="44" rx="6" fill="${i === 2 ? '#f0dcc0' : '#f5e9d0'}" stroke="${i === 2 ? GOLD : '#d4b878'}" stroke-width="${i === 2 ? 2.5 : 1.5}"/>`;
    s += `<text x="${x + 75}" y="${109}" text-anchor="middle" font-size="16" ${FONT} fill="${INK}">${c[0]}</text>`;
    s += `<rect x="${x}" y="132" width="150" height="52" rx="6" fill="#fdf6e3" stroke="#d4b878"/>`;
    s += `<text x="${x + 75}" y="${166}" text-anchor="middle" font-size="26" ${FONT} fill="${RED}">${c[1]}</text>`;
    s += `<rect x="${x}" y="192" width="150" height="52" rx="6" fill="#fdf6e3" stroke="#d4b878"/>`;
    s += `<text x="${x + 75}" y="${226}" text-anchor="middle" font-size="26" ${FONT} fill="${INK}">${c[2]}</text>`;
    s += `<text x="${x + 75}" y="${272}" text-anchor="middle" font-size="12" ${FONT} fill="#888">${c[3]}</text>`;
  });
  s += `<text x="380" y="320" text-anchor="middle" font-size="12" ${FONT} fill="#999">日柱为"日主"，代表本人，是四柱分析的核心</text>`;
  s += `</svg>`;
  save('bazi', 'sizhu.svg', s);
}

// ========== 6. 十神关系图 ==========
function shishen() {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="420" style="background:${BG}">`;
  s += `<text x="380" y="36" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">十神关系图（以日主为中心）</text>`;
  const center = { x: 380, y: 230 };
  const nodes = [
    { label: '比肩 · 劫财', sub: '同我者', x: 380, y: 70, c: '#4a6741' },
    { label: '食神 · 伤官', sub: '我生者', x: 660, y: 170, c: '#b04a2f' },
    { label: '正财 · 偏财', sub: '我克者', x: 600, y: 360, c: '#b8860b' },
    { label: '正官 · 七杀', sub: '克我者', x: 160, y: 360, c: '#2f4f6f' },
    { label: '正印 · 偏印', sub: '生我者', x: 100, y: 170, c: '#7a3b8f' },
  ];
  s += `<circle cx="${center.x}" cy="${center.y}" r="54" fill="#f0dcc0" stroke="${GOLD}" stroke-width="2.5"/>`;
  s += `<text x="${center.x}" y="${center.y - 6}" text-anchor="middle" font-size="20" ${FONT} fill="${RED}">日主</text>`;
  s += `<text x="${center.x}" y="${center.y + 20}" text-anchor="middle" font-size="12" ${FONT} fill="#888">（日干）</text>`;
  nodes.forEach((n) => {
    s += `<line x1="${center.x}" y1="${center.y}" x2="${n.x}" y2="${n.y}" stroke="#d4b878" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    s += `<rect x="${n.x - 78}" y="${n.y - 26}" width="156" height="52" rx="10" fill="#fdf6e3" stroke="${n.c}" stroke-width="1.8"/>`;
    s += `<text x="${n.x}" y="${n.y - 2}" text-anchor="middle" font-size="15" ${FONT} fill="${INK}">${n.label}</text>`;
    s += `<text x="${n.x}" y="${n.y + 18}" text-anchor="middle" font-size="11" ${FONT} fill="${n.c}">${n.sub}</text>`;
  });
  s += `<text x="380" y="408" text-anchor="middle" font-size="12" ${FONT} fill="#999">十神由日干与其它干支的五行生克关系推导：同我、我生、我克、克我、生我</text>`;
  s += `</svg>`;
  save('bazi', 'shishen.svg', s);
}

// ========== 7. 十二宫位轮盘 ==========
function gongwei() {
  const gongs = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','仆役','官禄','田宅','福德','父母'];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="620" style="background:${BG}">`;
  s += `<text x="310" y="40" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">紫微斗数十二宫位</text>`;
  const cx = 310, cy = 330, R = 250;
  for (let i = 0; i < 12; i++) {
    const a0 = -90 + i * 30, a1 = -90 + (i + 1) * 30;
    const rad0 = a0 * Math.PI / 180, rad1 = a1 * Math.PI / 180;
    const pts = [
      `${cx + R * Math.cos(rad0)},${cy + R * Math.sin(rad0)}`,
      `${cx + R * Math.cos(rad1)},${cy + R * Math.sin(rad1)}`,
      `${cx},${cy}`,
    ].join(' ');
    s += `<polygon points="${pts}" fill="${i % 2 ? '#fdf6e3' : '#f5e9d0'}" stroke="#d4b878" stroke-width="1.2"/>`;
    const ma = (a0 + a1) / 2 * Math.PI / 180;
    const lx = cx + 155 * Math.cos(ma), ly = cy + 155 * Math.sin(ma);
    s += `<text x="${lx}" y="${ly + 5}" text-anchor="middle" font-size="16" ${FONT} fill="${INK}">${gongs[i]}</text>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="62" fill="#f0dcc0" stroke="${GOLD}" stroke-width="2"/>`;
  s += `<text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="15" ${FONT} fill="${RED}">中宫</text>`;
  s += `<text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="12" ${FONT} fill="#888">（命盘）</text>`;
  s += `<text x="310" y="600" text-anchor="middle" font-size="12" ${FONT} fill="#999">十二宫各主不同人生领域：命宫论先天格局，财帛宫论财，官禄宫论事业</text>`;
  s += `</svg>`;
  save('ziwei', 'gongwei.svg', s);
}

// ========== 8. 十四主星表 ==========
function zhuxing() {
  const groups = [
    ['北斗星系', ['紫微','天机','太阳','武曲','天同','廉贞'], '#4a6741'],
    ['南斗星系', ['天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'], '#b04a2f'],
  ];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="400" style="background:${BG}">`;
  s += `<text x="380" y="36" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">紫微斗数十四主星</text>`;
  let y = 80;
  groups.forEach(([name, stars, color]) => {
    s += `<text x="50" y="${y + 28}" font-size="16" ${FONT} fill="${color}" font-weight="bold">${name}</text>`;
    stars.forEach((st, i) => {
      const x = 50 + i * 105;
      s += `<rect x="${x}" y="${y}" width="96" height="56" rx="10" fill="#fdf6e3" stroke="${color}" stroke-width="1.6"/>`;
      s += `<text x="${x + 48}" y="${y + 36}" text-anchor="middle" font-size="20" ${FONT} fill="${INK}">${st}</text>`;
    });
    y += 100;
  });
  s += `<text x="50" y="${y + 8}" font-size="13" ${FONT} fill="#888">注：十四主星是命盘的主干，另有六吉星（文昌文曲左辅右弼天魁天钺）、六煞星等辅佐星曜</text>`;
  s += `</svg>`;
  save('ziwei', 'zhuxing.svg', s);
}

// ========== 9. 九宫八卦洛书图 ==========
function jiugong() {
  const cells = [
    ['巽','四','东南'],['离','九','正南'],['坤','二','西南'],
    ['震','三','正东'],['中','五','中央'],['兑','七','正西'],
    ['艮','八','东北'],['坎','一','正北'],['乾','六','西北'],
  ];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="620" style="background:${BG}">`;
  s += `<text x="300" y="36" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">九宫八卦 · 洛书数理</text>`;
  s += `<text x="300" y="58" text-anchor="middle" font-size="13" ${FONT} fill="#888">戴九履一，左三右七，二四为肩，六八为足</text>`;
  cells.forEach((c, i) => {
    const x = 90 + (i % 3) * 160, y = 80 + Math.floor(i / 3) * 150;
    s += `<rect x="${x}" y="${y}" width="150" height="140" rx="12" fill="${i === 4 ? '#f0dcc0' : '#fdf6e3'}" stroke="${GOLD}" stroke-width="1.5"/>`;
    s += `<text x="${x + 75}" y="${y + 48}" text-anchor="middle" font-size="15" ${FONT} fill="${RED}">${c[0]}宫</text>`;
    s += `<text x="${x + 75}" y="${y + 92}" text-anchor="middle" font-size="36" ${FONT} fill="${INK}">${c[1]}</text>`;
    s += `<text x="${x + 75}" y="${y + 122}" text-anchor="middle" font-size="12" ${FONT} fill="#888">${c[2]}</text>`;
  });
  s += `<text x="300" y="600" text-anchor="middle" font-size="12" ${FONT} fill="#999">洛书九宫横竖斜相加均为 15，是奇门遁甲排盘的空间骨架</text>`;
  s += `</svg>`;
  save('qimen', 'jiugong.svg', s);
}

// ========== 10. 奇门三盘结构 ==========
function sanpan() {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="620" style="background:${BG}">`;
  s += `<text x="300" y="40" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">奇门遁甲三盘结构</text>`;
  const cx = 300, cy = 320;
  const layers = [
    { r: 260, name: '地盘（八宫）', color: '#4a6741', items: ['坎','艮','震','巽','离','坤','兑','乾'] },
    { r: 190, name: '人盘（八门）', color: '#b04a2f', items: ['休','生','伤','杜','景','死','惊','开'] },
    { r: 120, name: '天盘（九星）', color: '#2f4f6f', items: ['天蓬','天芮','天冲','天辅','天禽','天心','天柱','天任','天英'] },
  ];
  layers.forEach((L) => {
    s += `<circle cx="${cx}" cy="${cy}" r="${L.r}" fill="none" stroke="${L.color}" stroke-width="1.6" opacity="0.6"/>`;
    s += `<text x="${cx}" y="${cy - L.r - 10}" text-anchor="middle" font-size="13" ${FONT} fill="${L.color}">${L.name}</text>`;
    L.items.forEach((it, i) => {
      const ang = -90 + i * (360 / L.items.length);
      const rad = ang * Math.PI / 180;
      const mx = (L.r + 90) / 2;
      const x = cx + (L.r - 26) * Math.cos(rad), y = cy + (L.r - 26) * Math.sin(rad);
      s += `<text x="${x}" y="${y + 6}" text-anchor="middle" font-size="${L.items.length > 8 ? 13 : 15}" ${FONT} fill="${L.color}">${it}</text>`;
    });
  });
  s += `<circle cx="${cx}" cy="${cy}" r="40" fill="#f0dcc0" stroke="${GOLD}" stroke-width="2"/>`;
  s += `<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="14" ${FONT} fill="${RED}">值符</text>`;
  s += `<text x="300" y="600" text-anchor="middle" font-size="12" ${FONT} fill="#999">天盘随时辰转动，三盘叠加构成完整的奇门时空模型</text>`;
  s += `</svg>`;
  save('qimen', 'sanpan.svg', s);
}

// ========== 11. 先天八卦方位图 ==========
function bagua() {
  const trigrams = [['乾','☰','南'],['兑','☱','东南'],['离','☲','东'],['震','☳','东北'],['坤','☷','北'],['艮','☶','西北'],['坎','☵','西'],['巽','☴','西南']];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="620" style="background:${BG}">`;
  s += `<text x="310" y="40" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">先天八卦方位图</text>`;
  const cx = 310, cy = 330, R = 250;
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${GOLD}" stroke-width="2"/>`;
  trigrams.forEach((t, i) => {
    const ang = -90 + i * 45;
    const rad = ang * Math.PI / 180;
    const x = cx + R * Math.cos(rad), y = cy + R * Math.sin(rad);
    s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#d4b878" stroke-width="1"/>`;
    s += `<circle cx="${x}" cy="${y}" r="44" fill="#fdf6e3" stroke="${GOLD}" stroke-width="1.8"/>`;
    s += `<text x="${x}" y="${y - 8}" text-anchor="middle" font-size="28" ${FONT} fill="${RED}">${t[1]}</text>`;
    s += `<text x="${x}" y="${y + 20}" text-anchor="middle" font-size="14" ${FONT} fill="${INK}">${t[0]}</text>`;
    s += `<text x="${x}" y="${y + 38}" text-anchor="middle" font-size="11" ${FONT} fill="#888">${t[2]}</text>`;
  });
  s += `<circle cx="${cx}" cy="${cy}" r="40" fill="#f0dcc0" stroke="${GOLD}" stroke-width="2"/>`;
  s += `<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="15" ${FONT} fill="${RED}">太极</text>`;
  s += `<text x="310" y="600" text-anchor="middle" font-size="12" ${FONT} fill="#999">乾南坤北、离东坎西，两两相重即得六十四卦</text>`;
  s += `</svg>`;
  save('meihua', 'bagua.svg', s);
}

// ========== 12. 六十四卦矩阵（简化） ==========
function liushisi() {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="620" style="background:${BG}">`;
  s += `<text x="360" y="36" text-anchor="middle" font-size="24" ${FONT} fill="${RED}">八卦相重成六十四卦</text>`;
  s += `<text x="360" y="58" text-anchor="middle" font-size="13" ${FONT} fill="#888">上卦 × 下卦 = 六十四卦（8 × 8 矩阵）</text>`;
  const gs = ['乾☰','兑☱','离☲','震☳','巽☴','坎☵','艮☶','坤☷'];
  const cell = 66, ox = 40, oy = 80;
  gs.forEach((g, i) => {
    s += `<text x="${ox + 8 + i * cell}" y="${oy - 12}" font-size="14" ${FONT} fill="${RED}">${g}</text>`;
    s += `<text x="${ox - 14}" y="${oy + 20 + i * cell}" font-size="13" ${FONT} fill="${RED}">${g}</text>`;
  });
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const x = ox + c * cell, y = oy + r * cell;
      const isDiag = r === c;
      s += `<rect x="${x}" y="${y}" width="${cell - 4}" height="${cell - 4}" rx="6" fill="${isDiag ? '#f0dcc0' : '#fdf6e3'}" stroke="${isDiag ? GOLD : '#d4b878'}" stroke-width="1"/>`;
      s += `<text x="${x + (cell - 4) / 2}" y="${y + (cell - 4) / 2 + 6}" text-anchor="middle" font-size="12" ${FONT} fill="${INK}">${gs[c][0]}${gs[r][0]}</text>`;
    }
  }
  s += `<text x="360" y="${oy + 8 * cell + 30}" text-anchor="middle" font-size="12" ${FONT} fill="#999">例：乾上乾下为「乾为天」卦，坤上坤下为「坤为地」卦——64 卦由此而来</text>`;
  s += `</svg>`;
  save('meihua', 'liushisi.svg', s);
}

// ========== 生成全部 ==========
wuxing();
ganzhi();
jieqi();
shengxiao();
sizhu();
shishen();
gongwei();
zhuxing();
jiugong();
sanpan();
bagua();
liushisi();
console.log('🎉 全部 SVG 生成完成');
