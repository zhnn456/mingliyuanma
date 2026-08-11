import Link from 'next/link';
import './demo-home.css';

const cardImg = (prompt: string, size = 'portrait_4_3') =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;

const cards = [
  {
    num: '01',
    title: '四柱八字',
    en: 'Four Pillars',
    desc: '天干地支推演命运，五行旺衰解析格局，大运流年揭示人生起伏节奏。',
    href: '/bazi',
    img: cardImg(
      'Chinese traditional four pillars bazi fortune telling, dark red and gold ink painting, celestial stems and earthly branches calligraphy, mystical atmosphere, ancient scroll texture, cinematic dark background, oriental esoteric art'
    ),
  },
  {
    num: '02',
    title: '紫微斗数',
    en: 'Zi Wei Dou Shu',
    desc: '十二宫位星曜排列，十四主星揭示人生各方面运势，四化飞星洞悉命运转折。',
    href: '/ziwei',
    img: cardImg(
      'Purple star astrology ziwei doushu, dark night sky with golden constellations, twelve palaces grid, ancient Chinese star chart, deep purple and gold, mystical cosmic atmosphere, traditional oriental painting'
    ),
  },
  {
    num: '03',
    title: '奇门遁甲',
    en: 'Qi Men Dun Jia',
    desc: '古典决策智慧的文化展示，天地人神四盘推演，三奇六仪十干克应。',
    href: '/qimen',
    img: cardImg(
      'Qi men dun jia ancient Chinese divination, bagua eight trigrams diagram, nine palace grid, dark teal and gold, mysterious tactical board, celestial compass, oriental military strategy art, cinematic dark mystical'
    ),
  },
  {
    num: '04',
    title: '梅花易数',
    en: 'Mei Hua Yi Shu',
    desc: '以数起卦以象会意，六种起卦方式，体用分析卦象演变，古典哲学的趣味呈现。',
    href: '/meihua',
    img: cardImg(
      'Plum blossom divination mei hua yi shu, dark rose pink and gold, plum blossoms falling on ancient parchment, I ching hexagram symbols, delicate ink wash painting, oriental mystic fortune telling, soft cinematic'
    ),
  },
];

const features = [
  {
    num: '01 · 核心',
    title: '真太阳时校准的四柱排盘',
    desc: '依据出生地经纬度精确校正真太阳时，跨日自动更新年月日，防止子时排盘错误。四柱、十神、五行、神煞、纳音分层呈现，配合大运流年时间轴，逐层拆解命运结构。',
    tags: ['真太阳时', '四柱排盘', '十神关系', '大运流年'],
    bagua: true,
  },
  {
    num: '02 · 深度',
    title: '紫微斗数三视图切换',
    desc: '飞星、三合、四化三套体系独立呈现，每个 Tab 内容各异。本命、大限、流年、流月时间轴自由切换，命盘高清清晰，宫位交互探索，传承文墨天机排盘美学。',
    tags: ['飞星 / 三合 / 四化', '十二宫位', '十四主星', '时间轴切换'],
  },
  {
    num: '03 · 决策',
    title: '奇门遁甲与梅花易数',
    desc: '奇门遁甲 SVG 盘面 780px 高清呈现，八神九星、八门、天地盘干清晰可读，中宫局数醒目。梅花易数测事选项大字突出，体用分析与卦象演变，应期推断精准。',
    tags: ['奇门遁甲 SVG', '梅花易数', '六种起卦', '应期推断'],
  },
  {
    num: '04 · 出品',
    title: '专业解读报告与隐私守护',
    desc: '可导出精美 PDF 文化报告，含完整排盘数据与深度解读，水印标注出处。用户信息加密存储，记录严格保密，多端适配随时随地查阅。',
    tags: ['PDF 报告', '加密存储', '多端适配', '历史记录'],
  },
];

const steps = [
  { num: '一', title: '输入生辰', desc: '填写出生年月日时与地点，系统自动校正真太阳时，支持公历农历。' },
  { num: '二', title: '生成命盘', desc: '毫秒级排盘引擎按四柱、卦爻、宫位规则完成结构整理，即时呈现。' },
  { num: '三', title: '阅读解读', desc: '结合术语说明、图表细节与延伸文章，按自己的节奏深入理解命盘。' },
];

const baguaSvg = (
  <svg viewBox="0 0 200 200" className="dh-bagua" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#D4916A" stopOpacity="0.25" />
        <stop offset="70%" stopColor="#D4916A" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#D4916A" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="95" fill="url(#bgGlow)" />
    <circle cx="100" cy="100" r="92" fill="none" stroke="#D4916A" strokeWidth="0.8" opacity="0.6" />
    <circle cx="100" cy="100" r="70" fill="none" stroke="#D4916A" strokeWidth="0.5" opacity="0.4" />
    {/* 八卦爻 */}
    {[
      { y: 30, trigrams: [1, 1, 1] },
      { y: 0, x: 145, trigrams: [0, 1, 0] },
      { y: 170, trigrams: [1, 1, 1] },
      { y: 0, x: 55, trigrams: [0, 1, 0] },
    ].map((p, i) => null)}
    {/* 太极 */}
    <g transform="translate(100,100)">
      <path d="M0,-40 A40,40 0 0,1 0,40 A20,20 0 0,1 0,0 A20,20 0 0,0 0,-40 Z" fill="#D4916A" opacity="0.7" />
      <path d="M0,-40 A40,40 0 0,0 0,40 A20,20 0 0,0 0,0 A20,20 0 0,1 0,-40 Z" fill="#0a0a0f" opacity="0.9" />
      <circle cx="0" cy="-20" r="5" fill="#0a0a0f" />
      <circle cx="0" cy="20" r="5" fill="#D4916A" />
    </g>
    {/* 外圈八卦符号 */}
    {['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'].map((c, i) => {
      const angle = (i * 45 - 90) * (Math.PI / 180);
      const r = 82;
      const x = 100 + Math.cos(angle) * r;
      const y = 100 + Math.sin(angle) * r;
      return (
        <text
          key={c}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          fill="#D4916A"
          opacity="0.85"
          fontFamily="'KaiTi','STKaiti','楷体',serif"
        >
          {c}
        </text>
      );
    })}
  </svg>
);

const taijiSvg = (
  <svg viewBox="0 0 200 200" className="dh-taiji" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(100,100)">
      <circle r="95" fill="none" stroke="#D4916A" strokeWidth="0.5" opacity="0.5" />
      <circle r="70" fill="none" stroke="#D4916A" strokeWidth="0.3" opacity="0.3" />
      <path d="M0,-60 A60,60 0 0,1 0,60 A30,30 0 0,1 0,0 A30,30 0 0,0 0,-60 Z" fill="#D4916A" opacity="0.5" />
      <path d="M0,-60 A60,60 0 0,0 0,60 A30,30 0 0,0 0,0 A30,30 0 0,1 0,-60 Z" fill="#0a0a0f" opacity="0.7" />
      <circle cx="0" cy="-30" r="7" fill="#0a0a0f" />
      <circle cx="0" cy="30" r="7" fill="#D4916A" />
    </g>
  </svg>
);

export const metadata = {
  title: '知微阁 · 首页 Demo',
  description: '知微阁首页重设计 Demo - 暗色高端东方美学，四柱八字、紫微斗数、奇门遁甲、梅花易数。',
};

export default function DemoHomePage() {
  return (
    <div className="dh-wrap">
      {/* ===== Hero ===== */}
      <section className="dh-hero">
        <div className="dh-stars" />
        {taijiSvg}
        <div className="dh-orb dh-orb-1" />
        <div className="dh-orb dh-orb-2" />
        <div className="dh-orb dh-orb-3" />

        <div className="dh-hero-inner">
          <span className="dh-eyebrow">ZHI WEI GE</span>

          <h1 className="dh-display dh-title" data-text="知微阁">
            知微阁
          </h1>

          <p className="dh-subtitle">传承千年 · 解读命盘</p>

          <p className="dh-lead">
            融合四柱八字、紫微斗数、奇门遁甲、梅花易数四大传统文化体系，
            以真太阳时校准与毫秒级排盘引擎，为你呈上一份可以读下去的命盘地图。
          </p>

          <div className="dh-cta-row">
            <Link href="/bazi" className="dh-btn-primary">
              开始排盘 →
            </Link>
            <Link href="/membership" className="dh-btn-ghost">
              开通会员
            </Link>
          </div>

          <div className="dh-stats">
            <div>
              <div className="dh-stat-num">4 大</div>
              <div className="dh-stat-label">文化体系</div>
            </div>
            <div>
              <div className="dh-stat-num">50 万+</div>
              <div className="dh-stat-label">排盘数据</div>
            </div>
            <div>
              <div className="dh-stat-num">99.9%</div>
              <div className="dh-stat-label">计算精度</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 滚动文字 marquee ===== */}
      <div className="dh-marquee" aria-hidden>
        <div className="dh-marquee-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <div className="dh-marquee-item" key={k}>
              <span>甲</span><span>乙</span><span>丙</span><span>丁</span>
              <span>戊</span><span>己</span><span>庚</span><span>辛</span>
              <span>壬</span><span>癸</span>
              <span>子</span><span>丑</span><span>寅</span><span>卯</span>
              <span>辰</span><span>巳</span><span>午</span><span>未</span>
              <span>申</span><span>酉</span><span>戌</span><span>亥</span>
              <span>金</span><span>木</span><span>水</span><span>火</span>
              <span>土</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 四联播滑动卡片 ===== */}
      <section className="dh-section">
        <div className="dh-section-head">
          <span className="dh-section-label">SERVICES · 文化服务</span>
          <h2 className="dh-section-title">四大体系 · 一张命盘地图</h2>
          <p className="dh-section-desc">
            从四柱到星曜，从决策到解读 —— 四套传统文化体系在同一平台呈现，
            横向滑动探索每一项的入口。
          </p>
        </div>

        <div className="dh-carousel">
          <div className="dh-carousel-track">
            {cards.map((c) => (
              <Link key={c.title} href={c.href} className="dh-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="dh-card-img" src={c.img} alt={c.title} loading="lazy" />
                <div className="dh-card-mask" />
                <div className="dh-card-body">
                  <div className="dh-card-num">{c.num}</div>
                  <div className="dh-card-title">{c.title}</div>
                  <div className="dh-card-en">{c.en}</div>
                  <div className="dh-card-desc">{c.desc}</div>
                  <span className="dh-card-cta">立即体验 →</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="dh-progress">
            <div className="dh-progress-bar" />
          </div>
        </div>
      </section>

      {/* ===== 功能全览（序号引导） ===== */}
      <section className="dh-section dh-features">
        <div className="dh-section-head">
          <span className="dh-section-label">FEATURES · 功能全览</span>
          <h2 className="dh-section-title">不只是排盘 · 是一份可读的命盘</h2>
          <p className="dh-section-desc">
            先看四柱，再看五行比例与当岁运势，最后用深度解读把重点拆成你问得出口的问题。
          </p>
        </div>

        {features.map((f) => (
          <div className="dh-feature" key={f.num}>
            <div>
              <div className="dh-feature-num">{f.num}</div>
              <h3 className="dh-feature-title">{f.title}</h3>
              <p className="dh-feature-desc">{f.desc}</p>
              <div className="dh-feature-tags">
                {f.tags.map((t) => (
                  <span className="dh-feature-tag" key={t}>{t}</span>
                ))}
              </div>
            </div>
            <div>{f.bagua ? baguaSvg : null}</div>
          </div>
        ))}
      </section>

      {/* ===== 三步使用方式 ===== */}
      <section className="dh-section">
        <div className="dh-section-head">
          <span className="dh-section-label">HOW IT WORKS · 使用方式</span>
          <h2 className="dh-section-title">由排盘到理解 · 只留三个入口</h2>
        </div>

        <div className="dh-steps">
          {steps.map((s) => (
            <div className="dh-step" key={s.num}>
              <div className="dh-step-num">{s.num}</div>
              <h3 className="dh-step-title">{s.title}</h3>
              <p className="dh-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 会员 CTA ===== */}
      <section className="dh-cta-section">
        <div className="dh-section-head" style={{ marginBottom: '1.5rem' }}>
          <span className="dh-section-label">MEMBERSHIP · 会员尊享</span>
          <h2 className="dh-cta-title">开通会员 · 解锁全部功能</h2>
          <p className="dh-cta-desc">
            无限次排盘、深度文化解读、大运流年分析、专属 PDF 报告导出，
            一份完整可追溯的文化档案。
          </p>
        </div>

        <div className="dh-cta-tags">
          {['无限排盘', '深度解读', 'PDF 报告', '历史记录', '优先客服'].map((t) => (
            <span className="dh-cta-tag" key={t}>{t}</span>
          ))}
        </div>

        <Link href="/membership" className="dh-btn-primary">
          查看会员套餐 →
        </Link>
      </section>

      {/* ===== 页脚说明条 ===== */}
      <div className="dh-footer-strip">
        <p>知微阁 · 传承千年智慧 · 融合现代科技</p>
        <Link href="/" className="dh-back-link">
          ← 返回正式首页
        </Link>
      </div>
    </div>
  );
}
