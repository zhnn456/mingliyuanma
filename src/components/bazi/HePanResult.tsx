'use client';

import { useState } from 'react';

interface HePanResultProps {
  result: any;  // HePanResult，包含12个维度
  bazi1?: any;
  bazi2?: any;
}

// 根据分数获取颜色
function getScoreColor(score: number): { stroke: string; text: string; bg: string; bar: string } {
  if (score >= 90) return { stroke: '#16a34a', text: 'text-green-600', bg: 'bg-green-50', bar: 'bg-green-500' };
  if (score >= 75) return { stroke: '#0891b2', text: 'text-cyan-600', bg: 'bg-cyan-50', bar: 'bg-cyan-500' };
  if (score >= 60) return { stroke: '#d97706', text: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' };
  if (score >= 45) return { stroke: '#ea580c', text: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500' };
  return { stroke: '#dc2626', text: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' };
}

// 等级对应的装饰文案
function getLevelDesc(level: string): string {
  const map: Record<string, string> = {
    '天作之合': '缘分深厚，天赐良缘',
    '佳偶天成': '匹配优良，宜结良缘',
    '中等匹配': '中吉之配，需用心经营',
    '需多磨合': '差异较多，需多包容',
    '差异较大': '差异较大，宜慎重考量',
  };
  return map[level] || '';
}

// 十二个维度的图标
const DIM_ICONS: Record<string, string> = {
  wuxing: '🔥',
  rizhu: '💑',
  shengxiao: '🐾',
  xiyongshen: '⚡',
  shishen: '🌟',
  dayun: '📈',
  nayin: '🎵',
  fuguigong: '🏠',
  xingge: '🧠',
  caiyun: '💰',
  zinv: '👶',
  shensha: '✨',
};

// 十二个维度的顺序
const DIM_ORDER: string[] = [
  'wuxing',
  'rizhu',
  'shengxiao',
  'xiyongshen',
  'shishen',
  'dayun',
  'nayin',
  'fuguigong',
  'xingge',
  'caiyun',
  'zinv',
  'shensha',
];

const WX: Record<string, string> = {
  '金': '#d97706', '木': '#059669', '水': '#0284c7', '火': '#dc2626', '土': '#8b6914',
};
const GWX: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};
const ZWX: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

/** 合婚指数大圆环 */
function ScoreRing({ score }: { score: number }) {
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* 背景圆环 */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#f3f0ea"
          strokeWidth={stroke}
        />
        {/* 进度圆环 */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.4s ease' }}
        />
      </svg>
      {/* 中心文字 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-5xl font-bold ${color.text}`}>{score}</div>
        <div className="text-xs text-gray-400 mt-1 tracking-widest">合婚指数</div>
      </div>
    </div>
  );
}

/** 性格卡片 */
function PersonalityCard({
  personality,
  title,
  tone,
}: {
  personality: any;
  title: string;
  tone: 'blue' | 'rose';
}) {
  if (!personality) return null;

  const toneCls =
    tone === 'blue'
      ? 'from-blue-50/70 to-white border-blue-100'
      : 'from-rose-50/70 to-white border-rose-100';
  const headerCls = tone === 'blue' ? 'text-blue-700' : 'text-rose-700';
  const gan = personality.gan;
  const ganColor = gan ? WX[GWX[gan]] : undefined;

  return (
    <div className={`rounded-2xl border bg-gradient-to-b ${toneCls} p-5 shadow-sm`}>
      <div className={`text-sm font-medium ${headerCls} mb-3`}>{title}</div>
      <div className="flex items-center gap-3 mb-3">
        {gan && (
          <div
            className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ color: ganColor }}
          >
            {gan}
          </div>
        )}
        <div className="min-w-0">
          {personality.xingge && (
            <div className="text-sm font-semibold text-gray-800">{personality.xingge}</div>
          )}
          {Array.isArray(personality.traits) && personality.traits.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {personality.traits.map((t: string, i: number) => (
                <span
                  key={i}
                  className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${
                    tone === 'blue'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {personality.desc && (
        <p className="text-xs text-gray-500 leading-relaxed">{personality.desc}</p>
      )}
    </div>
  );
}

/** 单个维度卡片（支持展开/收起） */
function DimensionCard({
  dimKey,
  dim,
}: {
  dimKey: string;
  dim: { score: number; title: string; desc: string; details?: string[]; icon?: string };
}) {
  const [open, setOpen] = useState(false);
  const color = getScoreColor(dim.score);
  const icon = dim.icon || DIM_ICONS[dimKey] || '📊';
  const hasDetails = Array.isArray(dim.details) && dim.details.length > 0;

  return (
    <div className="rounded-2xl border border-parchment-200 bg-white shadow-sm p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center text-xl flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-gray-800">{dim.title}</div>
          <div className={`text-lg font-bold ${color.text}`}>
            {dim.score}
            <span className="text-xs text-gray-400 font-normal">/100</span>
          </div>
        </div>
        {hasDetails && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs text-gray-400 hover:text-amber-600 transition-colors flex-shrink-0"
            aria-expanded={open}
          >
            {open ? '收起 ▲' : '展开 ▼'}
          </button>
        )}
      </div>
      {/* 进度条 */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${color.bar} rounded-full`}
          style={{ width: `${dim.score}%`, transition: 'width 0.8s ease' }}
        />
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{dim.desc}</p>
      {/* 分项要点 */}
      {open && hasDetails && (
        <ul className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
          {dim.details!.map((d: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
              <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${color.bar} mt-1.5`} />
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 双方八字简表 */
function BaziSimpleTable({ bazi1, bazi2 }: { bazi1: any; bazi2: any }) {
  const renderPillar = (p: { gan: string; zhi: string } | undefined, label: string) => {
    if (!p || (!p.gan && !p.zhi)) {
      return (
        <div className="text-center py-3">
          <div className="text-xs text-gray-400 mb-1">{label}</div>
          <div className="text-2xl font-bold text-gray-300">—</div>
        </div>
      );
    }
    return (
      <div className="text-center py-3">
        <div className="text-xs text-gray-400 mb-1">{label}</div>
        <div className="text-2xl font-bold leading-tight" style={{ color: WX[GWX[p.gan]] }}>
          {p.gan}
        </div>
        <div className="text-2xl font-bold leading-tight" style={{ color: WX[ZWX[p.zhi]] }}>
          {p.zhi}
        </div>
      </div>
    );
  };

  const p1 = bazi1?.fourPillars;
  const p2 = bazi2?.fourPillars;

  if (!p1 && !p2) return null;

  return (
    <div className="card">
      <div className="font-medium text-gray-700 mb-4">双方八字四柱</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bazi1 && (
          <div className="rounded-xl bg-gradient-to-b from-blue-50/50 to-white border border-blue-100 p-4">
            <div className="text-sm font-medium text-blue-700 mb-2 text-center">
              {bazi1.gender === 'male' ? '乾造' : '坤造'}（一方）
            </div>
            <div className="grid grid-cols-4 divide-x divide-gray-100">
              {renderPillar(p1?.year, '年柱')}
              {renderPillar(p1?.month, '月柱')}
              {renderPillar(p1?.day, '日柱')}
              {renderPillar(p1?.hour, '时柱')}
            </div>
          </div>
        )}
        {bazi2 && (
          <div className="rounded-xl bg-gradient-to-b from-rose-50/50 to-white border border-rose-100 p-4">
            <div className="text-sm font-medium text-rose-700 mb-2 text-center">
              {bazi2.gender === 'male' ? '乾造' : '坤造'}（对方）
            </div>
            <div className="grid grid-cols-4 divide-x divide-gray-100">
              {renderPillar(p2?.year, '年柱')}
              {renderPillar(p2?.month, '月柱')}
              {renderPillar(p2?.day, '日柱')}
              {renderPillar(p2?.hour, '时柱')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 区块标题 */
function SectionTitle({ title, icon }: { title: string; icon?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="inline-block w-1 h-5 bg-gradient-to-b from-red-700 to-amber-500 rounded" />
      <h3 className="text-lg font-bold text-gray-800">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </h3>
    </div>
  );
}

export function HePanResult({ result, bazi1, bazi2 }: HePanResultProps) {
  if (!result) return null;

  const {
    score,
    level,
    dimensions,
    personality1,
    personality2,
    summary,
    suggestions,
    futureForecast,
    warnings,
    luckyTips,
  } = result;

  const color = getScoreColor(score);
  const levelDesc = getLevelDesc(level);

  // 组装12个维度列表
  const dimList: [string, any][] = DIM_ORDER
    .map((key) => [key, dimensions?.[key]] as [string, any])
    .filter(([, dim]) => dim && typeof dim.score === 'number');

  // 性格是否存在
  const hasPersonality = personality1 || personality2;

  // 兼容字符串数组或字符串
  const toArray = (v: any): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(Boolean);
    if (typeof v === 'string') return [v];
    return [];
  };

  const suggestionList = toArray(suggestions);
  const warningList = toArray(warnings);
  const luckyList = toArray(luckyTips);
  const forecastText =
    typeof futureForecast === 'string' ? futureForecast : '';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. 合婚指数大圆环 + 等级 */}
      <div className="card flex flex-col items-center py-8">
        <ScoreRing score={score} />
        <div className="mt-5 text-center">
          <div className={`text-2xl font-bold ${color.text}`}>{level}</div>
          {levelDesc && <div className="text-sm text-gray-500 mt-1">{levelDesc}</div>}
        </div>
      </div>

      {/* 2. 双方性格分析 */}
      {hasPersonality && (
        <div className="card">
          <SectionTitle title="双方性格分析" icon="🧠" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personality1 && (
              <PersonalityCard personality={personality1} title="一方性格" tone="blue" />
            )}
            {personality2 && (
              <PersonalityCard personality={personality2} title="对方性格" tone="rose" />
            )}
          </div>
        </div>
      )}

      {/* 3. 十二维度评分网格 */}
      {dimList.length > 0 && (
        <div>
          <SectionTitle title="十二维度契合分析" icon="📊" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dimList.map(([key, dim]) => (
              <DimensionCard key={key} dimKey={key} dim={dim} />
            ))}
          </div>
        </div>
      )}

      {/* 4. 双方八字简表 */}
      <BaziSimpleTable bazi1={bazi1} bazi2={bazi2} />

      {/* 5. 命理总评 */}
      {summary && (
        <div className="card">
          <SectionTitle title="命理总评" icon="📜" />
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{summary}</p>
        </div>
      )}

      {/* 6. 感情走向预测 */}
      {forecastText && (
        <div className="card bg-gradient-to-br from-amber-50/60 to-rose-50/40 border-amber-100">
          <SectionTitle title="感情走向预测" icon="🔮" />
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{forecastText}</p>
        </div>
      )}

      {/* 7. 相处建议 */}
      {suggestionList.length > 0 && (
        <div className="card">
          <SectionTitle title="相处建议" icon="💡" />
          <ul className="space-y-3">
            {suggestionList.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-red-600 to-amber-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-600 leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 8. 潜在考验 */}
      {warningList.length > 0 && (
        <div className="card bg-gradient-to-br from-orange-50/80 to-red-50/60 border-orange-200">
          <SectionTitle title="潜在考验" icon="⚠️" />
          <ul className="space-y-2">
            {warningList.map((w: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-orange-800 leading-relaxed">
                <span className="flex-shrink-0 text-orange-500 mt-0.5">▸</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 9. 开运建议 */}
      {luckyList.length > 0 && (
        <div className="card bg-gradient-to-br from-green-50/80 to-emerald-50/40 border-green-200">
          <SectionTitle title="开运建议" icon="🍀" />
          <ul className="space-y-2">
            {luckyList.map((l: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-800 leading-relaxed">
                <span className="flex-shrink-0 text-green-500 mt-0.5">✓</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
