'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';

interface Star {
  name: string;
  type: string;
  mutagen: string;
  brightness: string;
}

interface Palace {
  name: string;
  index: number;
  heavenlyStem: string;
  earthlyBranch: string;
  majorStars: Star[];
  minorStars: Star[];
  adjectiveStars: string[];
  changsheng12: string;
  boshi12: string;
  decadal: { range: [number, number] } | null;
  isBody: boolean;
}

interface ZiweiChartData {
  basic: {
    gender: string;
    solarDate: string;
    lunarDate: string;
    chineseDate: string;
    zodiac: string;
    sign: string;
    fiveElementsClass: string;
    soul: string;
    body: string;
    earthlyBranchOfBodyPalace: string;
    earthlyBranchOfSoulPalace: string;
  };
  palaces: Palace[];
}

export type ViewMode = 'feixing' | 'sanhe' | 'sihua';
export type TimeMode = 'base' | 'decadal' | 'annual' | 'monthly';

interface Props {
  data: ZiweiChartData;
  viewMode: ViewMode;
  timeMode: TimeMode;
  selectedPalaceIdx: number | null;
  onSelectPalace: (idx: number | null) => void;
}

const GRID_POSITIONS: Record<number, { row: number; col: number }> = {
  0: { row: 3, col: 0 }, 1: { row: 2, col: 0 }, 2: { row: 1, col: 0 }, 3: { row: 0, col: 0 },
  4: { row: 0, col: 1 }, 5: { row: 0, col: 2 }, 6: { row: 0, col: 3 },
  7: { row: 1, col: 3 }, 8: { row: 2, col: 3 }, 9: { row: 3, col: 3 },
  10: { row: 3, col: 2 }, 11: { row: 3, col: 1 },
};

const SANFANG_GROUPS: number[][] = [
  [0, 4, 8],
  [1, 5, 9],
  [2, 6, 10],
  [3, 7, 11],
];

const SANFANG: Record<number, number[]> = {
  0: [4, 8], 1: [5, 9], 2: [6, 10], 3: [7, 11],
  4: [0, 8], 5: [1, 9], 6: [2, 10], 7: [3, 11],
  8: [4, 0], 9: [5, 1], 10: [6, 2], 11: [7, 3],
};

const BRANCH_TO_IDX: Record<string, number> = {
  '寅': 0, '卯': 1, '辰': 2, '巳': 3, '午': 4, '未': 5,
  '申': 6, '酉': 7, '戌': 8, '亥': 9, '子': 10, '丑': 11,
};

const MUTAGEN_STYLE: Record<string, string> = {
  '化禄': 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  '化权': 'bg-blue-100 text-blue-800 border border-blue-300',
  '化科': 'bg-violet-100 text-violet-800 border border-violet-300',
  '化忌': 'bg-red-100 text-red-800 border border-red-300',
};

const BRIGHTNESS_STYLE: Record<string, string> = {
  '庙': 'text-red-600 font-bold',
  '旺': 'text-amber-600 font-bold',
  '得': 'text-blue-600',
  '利': 'text-sky-500',
  '平': 'text-gray-500',
  '不': 'text-gray-400',
  '陷': 'text-gray-400',
};

const SIHUA_TABLE: Record<string, { lu: string; quan: string; ke: string; ji: string }> = {
  '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
  '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
  '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
  '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
  '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
  '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
  '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
  '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
  '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
  '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' },
};

const STAR_COLOR: Record<string, string> = {
  '紫微': 'text-red-800', '天机': 'text-red-700', '太阳': 'text-amber-700', '武曲': 'text-slate-700',
  '天同': 'text-blue-700', '廉贞': 'text-red-600', '天府': 'text-amber-700', '太阴': 'text-indigo-600',
  '贪狼': 'text-purple-700', '巨门': 'text-slate-600', '天相': 'text-amber-600', '天梁': 'text-yellow-700',
  '七杀': 'text-red-700', '破军': 'text-slate-700',
};

const FEIXING_COLORS: Record<string, { stroke: string; fill: string; glow: string }> = {
  '化禄': { stroke: '#059669', fill: '#10b981', glow: 'rgba(16,185,129,0.35)' },
  '化权': { stroke: '#2563eb', fill: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
  '化科': { stroke: '#7c3aed', fill: '#8b5cf6', glow: 'rgba(139,92,246,0.35)' },
  '化忌': { stroke: '#dc2626', fill: '#ef4444', glow: 'rgba(239,68,68,0.35)' },
};

const SANFANG_COLORS: Record<number, { stroke: string; fill: string; name: string }> = {
  0: { stroke: '#C9A962', fill: '#D4AF37', name: '申子辰' },
  1: { stroke: '#059669', fill: '#10b981', name: '亥卯未' },
  2: { stroke: '#7C3AED', fill: '#8B5CF6', name: '寅午戌' },
  3: { stroke: '#0891B2', fill: '#06B6D4', name: '巳酉丑' },
};

// Time mode colors for 四化 overlay
const TIME_SIHUA_COLOR: Record<string, string> = {
  '化禄': 'border-l-4 border-l-emerald-500',
  '化权': 'border-l-4 border-l-blue-500',
  '化科': 'border-l-4 border-l-violet-500',
  '化忌': 'border-l-4 border-l-red-500',
};

function getStarColor(name: string): string {
  if (STAR_COLOR[name]) return STAR_COLOR[name];
  if (['左辅', '右弼', '天魁', '天钺'].some(s => name.includes(s))) return 'text-amber-600';
  if (['文昌', '文曲'].some(s => name.includes(s))) return 'text-blue-600';
  return 'text-slate-600';
}

// === 增大单元格尺寸，提升可读性 ===
const CELL_SIZE = 185;
const GAP = 0;
const GRID_TOTAL = CELL_SIZE * 4 + GAP * 3;

function getPalaceCenter(index: number): { x: number; y: number } {
  const pos = GRID_POSITIONS[index];
  const x = pos.col * (CELL_SIZE + GAP) + CELL_SIZE / 2;
  const y = pos.row * (CELL_SIZE + GAP) + CELL_SIZE / 2;
  return { x, y };
}

// 流年命宫计算：以流年地支为命宫位置
function getAnnualPalaceIdx(yearBranch: string): number {
  return BRANCH_TO_IDX[yearBranch] ?? 4;
}

// 流月命宫计算：以该月地支为命宫位置
function getMonthlyPalaceIdx(monthBranch: string): number {
  return BRANCH_TO_IDX[monthBranch] ?? 0;
}

export default function ZiweiChart({ data, viewMode, timeMode, selectedPalaceIdx, onSelectPalace }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // === 计算当前时间信息 ===
  const currentTime = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 从出生信息推算年龄
    const birthYearMatch = data.basic.solarDate?.match(/(\d{4})/);
    const birthYear = birthYearMatch ? parseInt(birthYearMatch[1]) : 1990;
    const age = currentYear - birthYear;

    // 当前流年天干地支
    const yearStems = ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'];
    const yearBranches = ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未'];
    const branchIdx = (currentYear - 2000) % 12;
    const stemIdx = (currentYear - 2000) % 10;
    const yearStem = yearStems[stemIdx] || '丙';
    const yearBranch = yearBranches[branchIdx] || '午';

    // 当前流月天干（五虎遁月干）
    const monthStemMap: Record<string, string[]> = {
      '甲': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
      '乙': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
      '丙': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
      '丁': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
      '戊': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
      '己': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
      '庚': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
      '辛': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
      '壬': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
      '癸': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
    };
    const monthBranches = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
    const monthBranchIdx = (currentMonth - 1 + 2) % 12;
    const monthBranch = monthBranches[monthBranchIdx];
    const monthStem = (monthStemMap[yearStem] || monthStemMap['丙'])[currentMonth - 1] || '庚';

    // 大限宫位：找到当前年龄对应的大限
    let decadalPalaceIdx: number | null = null;
    for (const palace of data.palaces) {
      if (palace.decadal?.range) {
        const [start, end] = palace.decadal.range;
        if (age >= start && age <= end) {
          decadalPalaceIdx = palace.index;
          break;
        }
      }
    }

    // 流年命宫
    const annualPalaceIdx = getAnnualPalaceIdx(yearBranch);

    // 流月命宫（基于流年命宫逆推）
    const monthOffsetMap: Record<string, number> = {
      '寅': 0, '卯': 1, '辰': 2, '巳': 3, '午': 4, '未': 5,
      '申': 6, '酉': 7, '戌': 8, '亥': 9, '子': 10, '丑': 11,
    };
    const monthBranchIdxVal = monthOffsetMap[monthBranch] ?? 0;
    // 流月命宫 = 流年命宫 逆数月份
    const monthlyPalaceIdx = (annualPalaceIdx - monthBranchIdxVal + 12) % 12;

    return {
      currentYear,
      age,
      yearStem,
      yearBranch,
      monthStem,
      monthBranch,
      decadalPalaceIdx,
      annualPalaceIdx,
      monthlyPalaceIdx,
    };
  }, [data]);

  // === 生年四化 ===
  const birthSihua = useMemo(() => {
    const yearStem = data.basic.chineseDate?.[0] || '甲';
    const stem = SIHUA_TABLE[yearStem] || SIHUA_TABLE['甲'];
    return {
      lu: { star: stem.lu, palace: '' },
      quan: { star: stem.quan, palace: '' },
      ke: { star: stem.ke, palace: '' },
      ji: { star: stem.ji, palace: '' },
    };
  }, [data]);

  const sihuaPalaces = useMemo(() => {
    const result: Record<string, number> = {};
    for (const palace of data.palaces) {
      for (const star of palace.majorStars) {
        if (star.name === birthSihua.lu.star) result['lu'] = palace.index;
        if (star.name === birthSihua.quan.star) result['quan'] = palace.index;
        if (star.name === birthSihua.ke.star) result['ke'] = palace.index;
        if (star.name === birthSihua.ji.star) result['ji'] = palace.index;
      }
    }
    birthSihua.lu.palace = data.palaces.find(p => p.index === result['lu'])?.name || '';
    birthSihua.quan.palace = data.palaces.find(p => p.index === result['quan'])?.name || '';
    birthSihua.ke.palace = data.palaces.find(p => p.index === result['ke'])?.name || '';
    birthSihua.ji.palace = data.palaces.find(p => p.index === result['ji'])?.name || '';
    return result;
  }, [data, birthSihua]);

  // === 时间四化（大限/流年/流月）===
  const timeSihua = useMemo(() => {
    if (timeMode === 'base') return null;

    let stem = '';
    let label = '';
    let palaces: Record<string, number> = {};

    if (timeMode === 'decadal') {
      if (currentTime.decadalPalaceIdx === null) return null;
      const palace = data.palaces.find(p => p.index === currentTime.decadalPalaceIdx);
      if (!palace) return null;
      stem = palace.heavenlyStem;
      label = `${palace.decadal?.range?.[0]}-${palace.decadal?.range?.[1]}岁大限`;
    } else if (timeMode === 'annual') {
      stem = currentTime.yearStem;
      label = `${currentTime.currentYear}流年（${currentTime.yearStem}${currentTime.yearBranch}）`;
    } else if (timeMode === 'monthly') {
      stem = currentTime.monthStem;
      label = `${currentTime.currentYear}年${new Date().getMonth() + 1}月流月`;
    }

    if (!stem || !SIHUA_TABLE[stem]) return null;
    const sihua = SIHUA_TABLE[stem];

    // 找到四化星落入的宫位
    for (const mutagenKey of ['lu', 'quan', 'ke', 'ji'] as const) {
      const starName = sihua[mutagenKey];
      const targetPalace = data.palaces.find(p =>
        p.majorStars.some(s => s.name === starName) ||
        p.minorStars.some(s => s.name === starName)
      );
      if (targetPalace) {
        palaces[mutagenKey] = targetPalace.index;
      }
    }

    return { stem, label, sihua, palaces };
  }, [timeMode, currentTime, data]);

  // === 当前时间高亮的宫位 ===
  const timeHighlightIdx = useMemo(() => {
    if (timeMode === 'decadal') return currentTime.decadalPalaceIdx;
    if (timeMode === 'annual') return currentTime.annualPalaceIdx;
    if (timeMode === 'monthly') return currentTime.monthlyPalaceIdx;
    return null;
  }, [timeMode, currentTime]);

  // === 飞星连线 ===
  const flyingLines = useMemo(() => {
    if (viewMode !== 'feixing') return [];
    const lines: Array<{ from: number; to: number; mutagen: string; star: string }> = [];
    for (const palace of data.palaces) {
      const stem = palace.heavenlyStem;
      if (!SIHUA_TABLE[stem]) continue;
      const sihua = SIHUA_TABLE[stem];
      for (const mutagenKey of ['lu', 'quan', 'ke', 'ji'] as const) {
        const starName = sihua[mutagenKey];
        const targetPalace = data.palaces.find(p =>
          p.majorStars.some(s => s.name === starName)
        );
        if (targetPalace && targetPalace.index !== palace.index) {
          const mutagenMap: Record<string, string> = { lu: '化禄', quan: '化权', ke: '化科', ji: '化忌' };
          lines.push({
            from: palace.index,
            to: targetPalace.index,
            mutagen: mutagenMap[mutagenKey],
            star: starName,
          });
        }
      }
    }
    return lines;
  }, [data, viewMode]);

  const sanfangLines = useMemo(() => {
    if (viewMode !== 'sanhe') return [];
    const lines: Array<{ a: number; b: number; group: number }> = [];
    SANFANG_GROUPS.forEach((group, gi) => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          lines.push({ a: group[i], b: group[j], group: gi });
        }
      }
    });
    return lines;
  }, [data, viewMode]);

  const sanfangPalaces = useMemo(() => {
    if (viewMode !== 'sanhe' || selectedPalaceIdx === null) return [];
    return SANFANG[selectedPalaceIdx] || [];
  }, [selectedPalaceIdx, viewMode]);

  const getPalaceHighlight = useCallback((idx: number): string => {
    const palace = data.palaces.find(p => p.index === idx);
    if (!palace) return '';

    if (selectedPalaceIdx === idx) {
      return 'bg-gradient-to-br from-amber-50 to-red-50 border-red-600 ring-2 ring-red-400/60 shadow-lg';
    }

    // 时间模式高亮
    if (timeHighlightIdx === idx && timeMode !== 'base') {
      return 'bg-gradient-to-br from-yellow-100 to-amber-100 border-amber-500 ring-2 ring-amber-400/50 shadow-md';
    }

    if (viewMode === 'feixing') {
      const isTarget = flyingLines.some(l => l.to === idx);
      const isSource = flyingLines.some(l => l.from === idx);
      if (isTarget && isSource) return 'bg-purple-50/80 border-purple-300';
      if (isTarget) return 'bg-emerald-50/80 border-emerald-300';
      if (isSource) return 'bg-blue-50/80 border-blue-300';
    }

    if (viewMode === 'sanhe') {
      if (sanfangPalaces.includes(idx)) return 'bg-amber-50 border-amber-400';
      if (selectedPalaceIdx !== null && SANFANG_GROUPS.some(g => g.includes(idx) && g.includes(selectedPalaceIdx)))
        return 'bg-amber-50 border-amber-400';
    }

    if (viewMode === 'sihua') {
      if (Object.values(sihuaPalaces).includes(idx)) return 'bg-amber-50/80 border-amber-300';
    }

    if (palace.name === '命宫') return 'bg-gradient-to-br from-red-50 to-amber-50 border-red-300';
    if (palace.isBody) return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200';
    return 'bg-[#FFFBF0] border-[#E8D5A8] hover:bg-[#FFF3E0] hover:border-amber-300';
  }, [data, viewMode, selectedPalaceIdx, flyingLines, sanfangPalaces, sihuaPalaces, timeHighlightIdx, timeMode]);

  // === SVG 渲染 ===
  const renderFeixingSVG = () => {
    return flyingLines.map((line, i) => {
      const from = getPalaceCenter(line.from);
      const to = getPalaceCenter(line.to);
      const c = FEIXING_COLORS[line.mutagen] || FEIXING_COLORS['化禄'];

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const curvature = Math.min(70, dist * 0.25);
      const nx = -dy / dist;
      const ny = dx / dist;
      const midX = (from.x + to.x) / 2 + nx * curvature;
      const midY = (from.y + to.y) / 2 + ny * curvature;

      const pathD = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
      const isRelated = selectedPalaceIdx === null ||
        line.from === selectedPalaceIdx || line.to === selectedPalaceIdx;

      const opacity = isRelated ? 0.85 : 0.08;
      const shadowOpacity = isRelated ? 0.15 : 0.03;

      return (
        <g key={`fx-${i}`} style={{ transition: 'opacity 0.3s ease' }}>
          <path d={pathD} fill="none" stroke={c.stroke} strokeWidth="3.5" strokeLinecap="round" opacity={shadowOpacity} />
          <path d={pathD} fill="none" stroke={c.stroke} strokeWidth={isRelated ? '2.2' : '1.2'} strokeLinecap="round"
            strokeDasharray={line.mutagen === '化忌' ? '7 4' : 'none'}
            opacity={opacity}
            markerEnd={isRelated ? `url(#arrow-${line.mutagen})` : undefined}
          />
          <circle cx={to.x} cy={to.y} r={isRelated ? 12 : 7} fill={c.fill} opacity={isRelated ? 0.25 : 0.08} />
          <circle cx={to.x} cy={to.y} r={isRelated ? 7 : 4} fill={c.fill} opacity={isRelated ? 0.9 : 0.3} />
          <circle cx={to.x} cy={to.y} r={isRelated ? 3 : 2} fill="#fff" opacity={isRelated ? 0.95 : 0.3} />
          <circle cx={from.x} cy={from.y} r={isRelated ? 6 : 4} fill="none" stroke={c.stroke}
            strokeWidth={isRelated ? 2.5 : 1.5} opacity={isRelated ? 0.7 : 0.2} />
        </g>
      );
    });
  };

  const renderSanheSVG = () => {
    return sanfangLines.map((line, i) => {
      const a = getPalaceCenter(line.a);
      const b = getPalaceCenter(line.b);
      const c = SANFANG_COLORS[line.group];
      const isHighlight = selectedPalaceIdx !== null &&
        (line.a === selectedPalaceIdx || line.b === selectedPalaceIdx);
      const isRelated = selectedPalaceIdx === null || isHighlight;

      return (
        <g key={`sh-${i}`} style={{ transition: 'opacity 0.3s ease' }}>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c.stroke}
            strokeWidth={isHighlight ? '6' : isRelated ? '3' : '2'} opacity={isHighlight ? 0.25 : isRelated ? 0.1 : 0.04} strokeLinecap="round" />
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c.stroke}
            strokeWidth={isHighlight ? '3' : isRelated ? '1.5' : '1'} opacity={isHighlight ? 0.9 : isRelated ? 0.5 : 0.15} strokeLinecap="round" />
          {isHighlight && (
            <>
              <circle cx={a.x} cy={a.y} r="5" fill={c.stroke} opacity="0.8" />
              <circle cx={b.x} cy={b.y} r="5" fill={c.stroke} opacity="0.8" />
            </>
          )}
        </g>
      );
    });
  };

  const renderSihuaSVG = () => {
    const markers: JSX.Element[] = [];
    const sihuaTypeMap: Record<string, { label: string; color: string; fill: string }> = {
      lu: { label: '禄', color: '#059669', fill: '#10b981' },
      quan: { label: '权', color: '#2563eb', fill: '#3b82f6' },
      ke: { label: '科', color: '#7c3aed', fill: '#8b5cf6' },
      ji: { label: '忌', color: '#dc2626', fill: '#ef4444' },
    };

    // 生年四化标记
    Object.entries(sihuaPalaces).forEach(([key, idx]) => {
      if (idx === undefined) return;
      const center = getPalaceCenter(idx);
      const type = sihuaTypeMap[key];
      const isSelected = selectedPalaceIdx !== null && selectedPalaceIdx === idx;
      const corners = [
        { x: center.x - CELL_SIZE / 2 + 8, y: center.y - CELL_SIZE / 2 + 8 },
        { x: center.x + CELL_SIZE / 2 - 8, y: center.y - CELL_SIZE / 2 + 8 },
        { x: center.x - CELL_SIZE / 2 + 8, y: center.y + CELL_SIZE / 2 - 8 },
        { x: center.x + CELL_SIZE / 2 - 8, y: center.y + CELL_SIZE / 2 - 8 },
      ];
      corners.forEach((corner, ci) => {
        markers.push(
          <rect key={`sihua-${key}-${ci}`}
            x={corner.x - (isSelected ? 6 : 5)} y={corner.y - (isSelected ? 6 : 5)}
            width={isSelected ? 12 : 10} height={isSelected ? 12 : 10}
            fill={isSelected ? type.fill : 'none'} stroke={type.color}
            strokeWidth={isSelected ? 3 : 2.5} opacity={isSelected ? 1 : 0.6} rx="2"
            style={{ transition: 'all 0.3s ease' }} />
        );
      });
      if (isSelected) {
        markers.push(
          <circle key={`sihua-${key}-center`} cx={center.x} cy={center.y} r="15"
            fill="none" stroke={type.color} strokeWidth="2.5" opacity="0.4" strokeDasharray="5 3" />
        );
      }
    });

    // 时间四化标记（虚线圆圈）
    if (timeSihua) {
      Object.entries(timeSihua.palaces).forEach(([key, idx]) => {
        if (idx === undefined) return;
        const center = getPalaceCenter(idx);
        const type = sihuaTypeMap[key];
        markers.push(
          <circle key={`time-sihua-${key}`}
            cx={center.x} cy={center.y} r="20"
            fill="none" stroke={type.color} strokeWidth="2.5"
            strokeDasharray="6 3" opacity="0.7" />
        );
        markers.push(
          <text key={`time-sihua-text-${key}`}
            x={center.x} y={center.y - 25}
            textAnchor="middle" fontSize="11" fontWeight="bold"
            fill={type.color} opacity="0.8">
            {type.label}
          </text>
        );
      });
    }

    return markers;
  };

  // === 中宫内容 - 根据视图和时间模式变化 ===
  const centerContent = () => {
    const timeLabel = timeMode === 'base' ? '本命盘' :
      timeMode === 'decadal' ? (timeSihua?.label || '大限盘') :
      timeMode === 'annual' ? (timeSihua?.label || '流年盘') :
      (timeSihua?.label || '流月盘');

    if (viewMode === 'sanhe') {
      return (
        <div className="relative text-center text-white px-4 py-3 w-full h-full flex flex-col justify-center">
          <div className="font-bold text-2xl tracking-wider text-[#FFD700]" style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}>
            紫微斗数
          </div>
          <div className="text-[11px] mt-0.5 text-[#C9A962]/80 tracking-[0.2em] font-mono">
            ZI · WEI · DOU · SHU
          </div>
          <div className="flex items-center justify-center gap-2 my-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A962]/60" />
            <div className="w-2 h-2 rounded-full bg-[#C9A962]" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A962]/60" />
          </div>
          <div className="text-xs text-red-100/80 font-mono tracking-wider mb-1">
            {data.basic.chineseDate}
          </div>
          <div className="text-sm text-[#FFD700]/90 mb-2">
            {data.basic.fiveElementsClass}
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="text-red-200/80">命主</span>
              <span className="font-bold text-[#FFD700]">{data.basic.soul || '--'}</span>
            </span>
            <span className="w-px h-4 bg-[#C9A962]/40" />
            <span className="flex items-center gap-1">
              <span className="text-red-200/80">身主</span>
              <span className="font-bold text-[#87CEEB]">{data.basic.body || '--'}</span>
            </span>
          </div>
          <div className="text-[10px] text-red-200/50 mt-1 tracking-wider">
            {data.basic.gender === '男' ? '乾造' : '坤造'} · {data.basic.zodiac}年
          </div>
          {/* 时间模式标签 */}
          <div className="mt-2 px-3 py-1 bg-[#C9A962]/20 rounded-full inline-block mx-auto">
            <span className="text-[11px] text-[#FFD700] font-medium">{timeLabel}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#C9A962]/30">
            <div className="text-[10px] text-[#C9A962]/70 tracking-widest mb-1">三方四正</div>
            <div className="space-y-0.5">
              {SANFANG_GROUPS.map((group, gi) => {
                const colors = ['#FFD700', '#6EE7B7', '#C4B5FD', '#7DD3FC'];
                const palaces = group.map(idx => data.palaces.find(p => p.index === idx)?.name || '').filter(Boolean);
                return (
                  <div key={gi} className="text-[10px] text-red-100/90 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: colors[gi] }} />
                    {palaces.join(' · ')}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === 'feixing') {
      const mingIdx = data.palaces.find(p => p.name === '命宫')?.index;
      const mingFlows = mingIdx !== undefined ? flyingLines.filter(l => l.from === mingIdx) : [];

      return (
        <div className="relative text-center text-white px-4 py-3 w-full h-full flex flex-col justify-center">
          <div className="font-bold text-2xl tracking-wider text-[#FFD700]" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            飞星四化
          </div>
          <div className="text-[11px] text-[#C9A962]/80 tracking-[0.15em] font-mono">
            FEI XING · DYNAMIC
          </div>
          <div className="flex items-center justify-center gap-2 my-2">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#C9A962]/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A962]" />
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#C9A962]/60" />
          </div>
          <div className="text-xs text-red-100/70 mb-2">
            共 {flyingLines.length} 条飞化路径
          </div>
          {/* 时间模式标签 */}
          <div className="mb-2 px-3 py-1 bg-[#C9A962]/20 rounded-full inline-block mx-auto">
            <span className="text-[11px] text-[#FFD700] font-medium">{timeLabel}</span>
          </div>
          {mingFlows.length > 0 && (
            <div className="text-left bg-[#5C1515]/40 rounded p-2 border border-[#C9A962]/20">
              <div className="text-[11px] text-[#FFD700] mb-1 text-center">命宫飞化</div>
              <div className="space-y-1">
                {mingFlows.map((l, i) => {
                  const targetPalace = data.palaces.find(p => p.index === l.to);
                  const colorMap: Record<string, string> = { '化禄': '#6EE7B7', '化权': '#93C5FD', '化科': '#C4B5FD', '化忌': '#FCA5A5' };
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colorMap[l.mutagen] }} />
                      <span className="text-red-100">{l.star}</span>
                      <span className="text-red-300/60">{l.mutagen}</span>
                      <span className="text-[#C9A962]/60">→</span>
                      <span className="font-bold text-red-100">{targetPalace?.name || ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* 时间四化信息 */}
          {timeSihua && (
            <div className="mt-2 text-left bg-[#5C1515]/30 rounded p-2 border border-[#C9A962]/15">
              <div className="text-[11px] text-[#FFD700] mb-1 text-center">{timeSihua.label}四化</div>
              <div className="grid grid-cols-2 gap-1">
                {(['lu', 'quan', 'ke', 'ji'] as const).map((key) => {
                  const star = timeSihua.sihua[key];
                  const pIdx = timeSihua.palaces[key];
                  const pName = pIdx !== undefined ? data.palaces.find(p => p.index === pIdx)?.name || '' : '';
                  const colorMap: Record<string, string> = { lu: '#6EE7B7', quan: '#93C5FD', ke: '#C4B5FD', ji: '#FCA5A5' };
                  const labelMap: Record<string, string> = { lu: '禄', quan: '权', ke: '科', ji: '忌' };
                  return (
                    <div key={key} className="flex items-center gap-1 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colorMap[key] }} />
                      <span className="text-red-100">{star}</span>
                      <span className="text-red-300/60">{labelMap[key]}</span>
                      <span className="text-[#C9A962]/60">→</span>
                      <span className="font-bold text-red-100">{pName || '?'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 text-[10px] text-red-200/60">
            <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />化禄</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />化权</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-violet-400 mr-1" />化科</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />化忌</span>
          </div>
        </div>
      );
    }

    if (viewMode === 'sihua') {
      return (
        <div className="relative text-center text-white px-4 py-3 w-full h-full flex flex-col justify-center">
          <div className="font-bold text-2xl tracking-wider text-[#FFD700]" style={{ fontFamily: '"Noto Serif SC", serif' }}>
            四化分布
          </div>
          <div className="text-[11px] text-[#C9A962]/80 tracking-[0.15em] font-mono">
            SIHUA · TRANSFORMATIONS
          </div>
          <div className="flex items-center justify-center gap-2 my-2">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#C9A962]/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A962]" />
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#C9A962]/60" />
          </div>
          {/* 生年四化 */}
          <div className="text-[11px] text-[#C9A962]/80 mb-1">生年四化</div>
          <div className="space-y-1.5">
            {(['lu', 'quan', 'ke', 'ji'] as const).map((key) => {
              const s = birthSihua[key];
              const palaceIdx = sihuaPalaces[key];
              const palaceName = palaceIdx !== undefined
                ? data.palaces.find(p => p.index === palaceIdx)?.name || ''
                : '';
              const mMap: Record<string, { label: string; color: string; bg: string }> = {
                lu: { label: '禄', color: '#059669', bg: 'bg-emerald-500/30 border-emerald-400/50' },
                quan: { label: '权', color: '#2563eb', bg: 'bg-blue-500/30 border-blue-400/50' },
                ke: { label: '科', color: '#7c3aed', bg: 'bg-violet-500/30 border-violet-400/50' },
                ji: { label: '忌', color: '#dc2626', bg: 'bg-red-500/30 border-red-400/50' },
              };
              return (
                <div key={key} className={`flex items-center justify-between px-3 py-1 rounded text-xs border ${mMap[key].bg}`}>
                  <span className="text-red-100">
                    <span className="font-bold">{s.star}</span>
                    <span className="ml-1.5 opacity-70">{mMap[key].label}</span>
                  </span>
                  <span className="text-[#FFD700] font-medium">{palaceName || '未知'}</span>
                </div>
              );
            })}
          </div>
          {/* 时间四化 */}
          {timeSihua && (
            <>
              <div className="mt-3 pt-2 border-t border-[#C9A962]/30 text-[11px] text-[#FFD700] mb-1">
                {timeSihua.label}四化
              </div>
              <div className="space-y-1">
                {(['lu', 'quan', 'ke', 'ji'] as const).map((key) => {
                  const star = timeSihua.sihua[key];
                  const pIdx = timeSihua.palaces[key];
                  const pName = pIdx !== undefined ? data.palaces.find(p => p.index === pIdx)?.name || '' : '';
                  const mMap: Record<string, { label: string; bg: string }> = {
                    lu: { label: '禄', bg: 'bg-emerald-500/20 border-emerald-400/30' },
                    quan: { label: '权', bg: 'bg-blue-500/20 border-blue-400/30' },
                    ke: { label: '科', bg: 'bg-violet-500/20 border-violet-400/30' },
                    ji: { label: '忌', bg: 'bg-red-500/20 border-red-400/30' },
                  };
                  return (
                    <div key={`time-${key}`} className={`flex items-center justify-between px-3 py-0.5 rounded text-[11px] border ${mMap[key].bg}`}>
                      <span className="text-red-100">
                        <span className="font-bold">{star}</span>
                        <span className="ml-1.5 opacity-70">{mMap[key].label}</span>
                      </span>
                      <span className="text-[#FFD700]">{pName || '?'}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <div className="mt-2 pt-2 border-t border-[#C9A962]/30 text-[10px] text-[#C9A962]/80">
            {data.basic.fiveElementsClass} · {data.basic.chineseDate}
          </div>
        </div>
      );
    }

    return null;
  };

  // === 判断是否显示星曜（根据视图模式）===
  const shouldShowStars = (starType: 'major' | 'minor' | 'adjective'): boolean => {
    if (viewMode === 'sanhe') return true; // 三合盘显示所有星
    if (viewMode === 'feixing') return starType === 'major'; // 飞星盘只显示主星
    if (viewMode === 'sihua') return starType === 'major' || starType === 'minor'; // 四化盘显示主星和辅星
    return true;
  };

  return (
    <div className="card !p-0 overflow-hidden ziwei-chart-container rounded-xl shadow-2xl border border-amber-800/30">
      {/* 标题栏 */}
      <div className="relative bg-gradient-to-r from-[#7B1F1F] via-[#9B2C2C] to-[#7B1F1F] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 30m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A962] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A962]/70 to-transparent" />

        <div className="relative flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#B22222] border-2 border-[#C9A962] rounded flex flex-col items-center justify-center shadow-inner">
              <span className="text-[10px] text-[#FFD700] leading-tight">命理</span>
              <span className="text-[10px] text-[#FFD700] leading-tight">玄鉴</span>
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-wide" style={{ fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif' }}>
                紫微斗数 · 命盘
              </h2>
              <p className="text-xs text-red-200/90 mt-0.5 tracking-wider">
                {viewMode === 'feixing' && '飞星视图 · 宫干四化飞化路径'}
                {viewMode === 'sanhe' && '三合视图 · 三方四正星曜组合'}
                {viewMode === 'sihua' && '四化视图 · 禄权科忌分布'}
                {timeMode !== 'base' && (
                  <span className="ml-2 text-[#FFD700]">
                    · {timeMode === 'decadal' ? '大限' : timeMode === 'annual' ? '流年' : '流月'}模式
                  </span>
                )}
                <span className="ml-2 text-red-300/60">· 点击宫位查看详情</span>
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs text-red-200">
            {viewMode === 'feixing' && (
              <>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-300/80" />飞化源宫</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-300/80" />飞化目标</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-300/80" />化忌</span>
              </>
            )}
            {viewMode === 'sanhe' && (
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-300/80" />三方四正</span>
            )}
            {viewMode === 'sihua' && (
              <>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400" />化禄</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-400" />化权</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-violet-400" />化科</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400" />化忌</span>
              </>
            )}
            {timeMode !== 'base' && (
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400/80 ring-2 ring-amber-200" />当前时段</span>
            )}
          </div>
        </div>
      </div>

      {/* 命盘区域 */}
      <div
        className="relative p-3 overflow-x-auto"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(201,169,98,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(155,44,44,0.05) 0%, transparent 50%),
            linear-gradient(135deg, #FDF6E3 0%, #F5E6C8 40%, #EDDDB5 70%, #F5E6C8 100%)
          `,
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />

        <div
          ref={containerRef}
          className="relative mx-auto"
          style={{ width: GRID_TOTAL, height: GRID_TOTAL, minWidth: GRID_TOTAL }}
        >
          {/* SVG 连线层 */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            width={GRID_TOTAL}
            height={GRID_TOTAL}
            viewBox={`0 0 ${GRID_TOTAL} ${GRID_TOTAL}`}
            style={{ zIndex: 3 }}
          >
            <defs>
              <marker id="arrow-化禄" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 12 6 L 0 12 z" fill="#059669" />
              </marker>
              <marker id="arrow-化权" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 12 6 L 0 12 z" fill="#2563eb" />
              </marker>
              <marker id="arrow-化科" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 12 6 L 0 12 z" fill="#7c3aed" />
              </marker>
              <marker id="arrow-化忌" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M 0 0 L 12 6 L 0 12 z" fill="#dc2626" />
              </marker>
            </defs>

            {viewMode === 'feixing' && renderFeixingSVG()}
            {viewMode === 'sanhe' && renderSanheSVG()}
            {viewMode === 'sihua' && renderSihuaSVG()}
          </svg>

          {/* 宫位网格 */}
          <div
            className="relative grid grid-cols-4 gap-0"
            style={{ width: GRID_TOTAL, height: GRID_TOTAL, zIndex: 2 }}
          >
            {/* 中宫 */}
            <div
              className="relative flex items-center justify-center overflow-hidden"
              style={{
                gridRow: '2 / 4',
                gridColumn: '2 / 4',
                width: CELL_SIZE * 2,
                height: CELL_SIZE * 2,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#7B1F1F] via-[#9B2C2C] to-[#7B1F1F]" />
              <div className="absolute inset-1 border-2 border-[#C9A962]/80 rounded-sm" />
              <div className="absolute inset-2 border border-[#C9A962]/30 rounded-sm" />
              <div className="absolute inset-0 opacity-[0.05]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0v40M0 20h40' stroke='%23fff' stroke-width='0.5'/%3E%3C/svg%3E")`,
              }} />
              {centerContent()}
            </div>

            {/* 十二宫 */}
            {Array.from({ length: 12 }).map((_, branchIdx) => {
              const pos = GRID_POSITIONS[branchIdx];
              if (!pos) return null;
              const palace = data.palaces.find(p => p.index === branchIdx);
              if (!palace) return null;

              const isSelected = selectedPalaceIdx === branchIdx;
              const isTimeHighlight = timeHighlightIdx === branchIdx && timeMode !== 'base';
              const decadalRange = palace.decadal?.range;
              const isLife = palace.name === '命宫';
              const gridRow = pos.row + 1;
              const gridCol = pos.col + 1;
              const highlightClass = getPalaceHighlight(branchIdx);

              return (
                <div
                  key={branchIdx}
                  onClick={() => onSelectPalace(isSelected ? null : branchIdx)}
                  style={{
                    gridRow,
                    gridColumn: gridCol,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                  className={`p-2.5 border cursor-pointer transition-all duration-200 flex flex-col relative z-10 ${highlightClass}`}
                >
                  {/* 宫位名称行 */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-amber-700/60 font-mono">
                        {palace.heavenlyStem}{palace.earthlyBranch}
                      </span>
                      <span className={`font-bold text-[16px] tracking-wide ${isLife ? 'text-red-700' : 'text-red-800'}`} style={{ fontFamily: '"Noto Serif SC", serif' }}>
                        {palace.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {palace.isBody && (
                        <span className="text-[10px] text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded font-medium border border-indigo-200">身</span>
                      )}
                      {decadalRange && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono border border-amber-200/60">
                          {decadalRange[0]}-{decadalRange[1]}
                        </span>
                      )}
                      {isTimeHighlight && (
                        <span className="text-[10px] text-[#FFD700] bg-amber-600/80 px-1.5 py-0.5 rounded font-bold border border-amber-400">
                          {timeMode === 'decadal' ? '限' : timeMode === 'annual' ? '年' : '月'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 主星 - 字号增大 */}
                  {shouldShowStars('major') && palace.majorStars.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {palace.majorStars.map((star, si) => (
                        <span
                          key={si}
                          className={`inline-flex items-center gap-1 text-[14px] px-1.5 py-0.5 rounded-sm ${
                            star.mutagen
                              ? MUTAGEN_STYLE[star.mutagen] || 'bg-gray-100 text-gray-700'
                              : star.brightness && ['庙', '旺', '得'].includes(star.brightness)
                              ? 'bg-red-50/80 text-red-700 font-medium'
                              : 'bg-slate-50/80 text-slate-700'
                          }`}
                        >
                          <span className={getStarColor(star.name)}>{star.name}</span>
                          {star.brightness && (
                            <span className={`text-[10px] ${BRIGHTNESS_STYLE[star.brightness] || 'text-gray-400'}`}>
                              {star.brightness}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 辅星 - 字号增大 */}
                  {shouldShowStars('minor') && palace.minorStars.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {palace.minorStars.map((star, si) => (
                        <span key={si} className={`text-[12px] px-1.5 py-0.5 rounded-sm ${getStarColor(star.name)} bg-slate-50/60`}>
                          {star.name}
                          {star.mutagen && <span className="text-[10px] ml-0.5 opacity-70">[{star.mutagen.replace('化', '')}]</span>}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 杂曜 - 三合盘才显示 */}
                  {shouldShowStars('adjective') && palace.adjectiveStars && palace.adjectiveStars.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 flex-1">
                      {palace.adjectiveStars.slice(0, 6).map((name, si) => (
                        <span key={si} className="text-[10px] text-slate-400 px-1 rounded bg-white/40">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 长生博士 */}
                  {(palace.changsheng12 || palace.boshi12) && (
                    <div className="flex justify-between text-[9px] text-amber-700/50 mt-auto pt-1 border-t border-amber-200/30">
                      {palace.changsheng12 ? <span>{palace.changsheng12}</span> : <span />}
                      {palace.boshi12 ? <span>{palace.boshi12}</span> : <span />}
                    </div>
                  )}

                  {/* 四化盘角标 */}
                  {viewMode === 'sihua' && Object.entries(sihuaPalaces).map(([key, idx]) =>
                    idx === branchIdx ? (
                      <span
                        key={key}
                        className={`absolute top-0 right-0 text-[11px] px-2 py-0.5 rounded-bl font-bold text-white ${
                          key === 'lu' ? 'bg-emerald-600' :
                          key === 'quan' ? 'bg-blue-600' :
                          key === 'ke' ? 'bg-violet-600' :
                          'bg-red-600'
                        }`}
                      >
                        {key === 'lu' ? '禄' : key === 'quan' ? '权' : key === 'ke' ? '科' : '忌'}
                      </span>
                    ) : null
                  )}

                  {/* 时间四化角标 */}
                  {timeSihua && Object.entries(timeSihua.palaces).map(([key, idx]) =>
                    idx === branchIdx ? (
                      <span
                        key={`time-${key}`}
                        className={`absolute bottom-0 left-0 text-[10px] px-1.5 py-0.5 rounded-tr font-bold ${
                          key === 'lu' ? 'bg-emerald-500/80 text-white' :
                          key === 'quan' ? 'bg-blue-500/80 text-white' :
                          key === 'ke' ? 'bg-violet-500/80 text-white' :
                          'bg-red-500/80 text-white'
                        }`}
                      >
                        {key === 'lu' ? '禄' : key === 'quan' ? '权' : key === 'ke' ? '科' : '忌'}
                      </span>
                    ) : null
                  )}

                  {isSelected && (
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-600 rounded-full shadow animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
