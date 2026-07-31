'use client';

import React from 'react';

interface QimenPalace {
  position: number;
  trigram: string;
  gate: string;
  star: string;
  deity: string;
  heavenlyStem: string;
  earthlyStem: string;
  earthBranch: string;
  fiveElements: string;
  voidness: { hasVoidness: boolean };
  innerOuter: string;
  isZhiFu?: boolean;
  isZhiShi?: boolean;
  horse?: boolean;
  auspiciousPatterns?: Array<{ name: string }>;
  inauspiciousPatterns?: Array<{ name: string }>;
}

interface QimenResult {
  timeInfo: {
    solarDate: string;
    lunarDate: string;
    chineseYear: string;
    chineseMonth: string;
    chineseDay: string;
    chineseTime: string;
    timeName: string;
    solarTerm: string;
    xunShou: string;
    voidness: string[];
  };
  fourPillars: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string };
  };
  ju: { type: string; number: number };
  yuan: string;
  zhiFu: { star: string; position: number };
  zhiShi: { gate: string; position: number };
  palaces: QimenPalace[];
  specialPatterns?: {
    fuYinFanYin?: { description: string[] };
    wuBuYuShi?: { isWuBuYuShi: boolean; description?: string };
    auspiciousPatterns?: Array<{ name: string }>;
    inauspiciousPatterns?: Array<{ name: string }>;
  };
}

interface QimenChartProps {
  result: QimenResult;
  selectedPosition: number | null;
  onSelectPosition: (pos: number | null) => void;
}

const GRID_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];

const TRIGRAM_DIRECTION: Record<string, string> = {
  '坎': '北', '坤': '西南', '震': '东', '巽': '东南',
  '乾': '西北', '兑': '西', '艮': '东北', '离': '南',
};

const GATE_COLORS: Record<string, string> = {
  '开门': '#22c55e',
  '休门': '#3b82f6',
  '生门': '#10b981',
  '伤门': '#ef4444',
  '杜门': '#6b7280',
  '景门': '#f59e0b',
  '死门': '#374151',
  '惊门': '#f97316',
};

const ELEMENT_COLORS: Record<string, string> = {
  '金': '#d97706',
  '木': '#16a34a',
  '水': '#2563eb',
  '火': '#dc2626',
  '土': '#ca8a04',
};

export default function QimenChart({ result, selectedPosition, onSelectPosition }: QimenChartProps) {
  const SVG_SIZE = 780;
  const PALACE_SIZE = 220;
  const GAP = 12;
  const CENTER = SVG_SIZE / 2;

  const getPalaceByPosition = (pos: number) => result.palaces.find(p => p.position === pos);

  const getPalaceRect = (index: number) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const totalWidth = 3 * PALACE_SIZE + 2 * GAP;
    const offsetX = (SVG_SIZE - totalWidth) / 2;
    const offsetY = (SVG_SIZE - totalWidth) / 2;
    const x = offsetX + col * (PALACE_SIZE + GAP);
    const y = offsetY + row * (PALACE_SIZE + GAP);
    return { x, y, w: PALACE_SIZE, h: PALACE_SIZE };
  };

  return (
    <div className="flex flex-col items-center">
      {/* 起卦信息标题区 */}
      <div className="mb-4 text-center">
        <div className="inline-block relative">
          <h2 className="text-xl font-bold text-red-800 tracking-wider" style={{ fontFamily: 'Noto Serif SC, STSong, serif' }}>
            {result.ju.type}{result.ju.number}局 · {result.yuan}
          </h2>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent" />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {result.timeInfo.solarTerm} · 旬首{result.timeInfo.xunShou} · 空亡{result.timeInfo.voidness?.join('、') || '无'}
        </p>
      </div>

      {/* SVG 奇门盘面 */}
      <svg
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="max-w-full"
        style={{ filter: 'drop-shadow(0 4px 20px rgba(139, 0, 0, 0.2))' }}
      >
        <defs>
          {/* 背景渐变色 */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef9f0" />
            <stop offset="50%" stopColor="#fdf4e3" />
            <stop offset="100%" stopColor="#fef9f0" />
          </linearGradient>
          
          {/* 中宫渐变 */}
          <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="50%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          {/* 值符宫高亮 */}
          <linearGradient id="zhiFuHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>

          {/* 值使宫高亮 */}
          <linearGradient id="zhiShiHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>

          {/* 选中宫高亮 */}
          <linearGradient id="selectedHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fee2e2" />
            <stop offset="100%" stopColor="#fecaca" />
          </linearGradient>

          {/* 金色边框 */}
          <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4a574" />
            <stop offset="50%" stopColor="#f4d4a0" />
            <stop offset="100%" stopColor="#d4a574" />
          </linearGradient>

          {/* 图案背景 */}
          <pattern id="paperTexture" patternUnits="userSpaceOnUse" width="100" height="100">
            <rect width="100" height="100" fill="#fef9f0" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#d4a574" strokeWidth="0.5" opacity="0.1" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#d4a574" strokeWidth="0.5" opacity="0.1" />
          </pattern>

          {/* 发光效果 */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* 外层装饰边框 */}
        <rect
          x="10" y="10"
          width={SVG_SIZE - 20}
          height={SVG_SIZE - 20}
          fill="none"
          stroke="url(#goldBorder)"
          strokeWidth="3"
          rx="8"
        />
        <rect
          x="18" y="18"
          width={SVG_SIZE - 36}
          height={SVG_SIZE - 36}
          fill="none"
          stroke="#d4a574"
          strokeWidth="1"
          rx="6"
          opacity="0.6"
        />

        {/* 九宫格 */}
        {GRID_ORDER.map((pos, index) => {
          const palace = getPalaceByPosition(pos);
          if (!palace) return null;
          
          const rect = getPalaceRect(index);
          const isCenter = pos === 5;
          const isSelected = selectedPosition === pos;
          const isZhiFu = palace.isZhiFu;
          const isZhiShi = palace.isZhiShi;

          let fillColor = '#ffffff';
          if (isCenter) {
            fillColor = 'url(#centerGradient)';
          } else if (isSelected) {
            fillColor = 'url(#selectedHighlight)';
          } else if (isZhiFu) {
            fillColor = 'url(#zhiFuHighlight)';
          } else if (isZhiShi) {
            fillColor = 'url(#zhiShiHighlight)';
          }

          return (
            <g
              key={pos}
              onClick={() => onSelectPosition(isSelected ? null : pos)}
              style={{ cursor: 'pointer' }}
            >
              {/* 宫位背景 */}
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                fill={fillColor}
                stroke={isCenter ? '#991b1b' : '#d4a574'}
                strokeWidth={isCenter ? 3 : 1.5}
                rx="4"
                filter="url(#shadow)"
              />
              
              {/* 宫位内边框 */}
              {!isCenter && (
                <rect
                  x={rect.x + 6}
                  y={rect.y + 6}
                  width={rect.w - 12}
                  height={rect.h - 12}
                  fill="none"
                  stroke={isZhiFu ? '#d97706' : isZhiShi ? '#2563eb' : '#d4a574'}
                  strokeWidth="1"
                  rx="2"
                  opacity="0.5"
                  strokeDasharray={isCenter ? 'none' : '2,2'}
                />
              )}

              {isCenter ? (
                /* 中宫 - 局数信息 */
                <g>
                  {/* 中宫装饰 */}
                  <circle
                    cx={rect.x + rect.w / 2}
                    cy={rect.y + rect.h / 2}
                    r="75"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  <circle
                    cx={rect.x + rect.w / 2}
                    cy={rect.y + rect.h / 2}
                    r="62"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1"
                    opacity="0.4"
                    strokeDasharray="4,4"
                  />
                  
                  {/* 局数文字 */}
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + rect.h / 2 - 45}
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="18"
                    fontWeight="500"
                  >
                    {result.ju.type}
                  </text>
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + rect.h / 2 - 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="52"
                    fontWeight="bold"
                    style={{ fontFamily: 'Noto Serif SC, STSong, serif' }}
                  >
                    {result.ju.number}
                  </text>
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + rect.h / 2 + 32}
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="20"
                  >
                    局
                  </text>
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + rect.h / 2 + 62}
                    textAnchor="middle"
                    fill="#fef3c7"
                    fontSize="15"
                  >
                    {result.yuan}
                  </text>
                  
                  {/* 值符值使信息 */}
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + rect.h - 22}
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="13"
                  >
                    值符·{result.zhiFu.star} | 值使·{result.zhiShi.gate}
                  </text>
                </g>
              ) : (
                /* 其他宫位 */
                <g>
                  {/* 宫位头部 - 卦名和方位 */}
                  <text
                    x={rect.x + 14}
                    y={rect.y + 24}
                    fill="#991b1b"
                    fontSize="17"
                    fontWeight="bold"
                    style={{ fontFamily: 'Noto Serif SC, serif' }}
                  >
                    {palace.trigram}宫
                  </text>
                  <text
                    x={rect.x + rect.w - 14}
                    y={rect.y + 24}
                    textAnchor="end"
                    fill="#9ca3af"
                    fontSize="12"
                  >
                    {TRIGRAM_DIRECTION[palace.trigram] || ''}·{pos}宫
                  </text>

                  {/* 八神 */}
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + 50}
                    textAnchor="middle"
                    fill="#7c3aed"
                    fontSize="16"
                    fontWeight="600"
                  >
                    {palace.deity}
                  </text>

                  {/* 九星 */}
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + 74}
                    textAnchor="middle"
                    fill="#1d4ed8"
                    fontSize="16"
                  >
                    {palace.star}{palace.horse ? ' 🐴' : ''}
                  </text>

                  {/* 八门 */}
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + 98}
                    textAnchor="middle"
                    fill={GATE_COLORS[palace.gate] || '#374151'}
                    fontSize="17"
                    fontWeight="600"
                  >
                    {palace.gate}
                  </text>

                  {/* 分隔线 */}
                  <line
                    x1={rect.x + 24}
                    y1={rect.y + 112}
                    x2={rect.x + rect.w - 24}
                    y2={rect.y + 112}
                    stroke="#d4a574"
                    strokeWidth="0.8"
                    opacity="0.5"
                  />

                  {/* 天盘干 / 地盘干 */}
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + 138}
                    textAnchor="middle"
                    fill="#dc2626"
                    fontSize="24"
                    fontWeight="bold"
                    style={{ fontFamily: 'Noto Serif SC, serif' }}
                  >
                    {palace.heavenlyStem}
                  </text>
                  <text
                    x={rect.x + rect.w / 2}
                    y={rect.y + 162}
                    textAnchor="middle"
                    fill="#6b7280"
                    fontSize="20"
                    style={{ fontFamily: 'Noto Serif SC, serif' }}
                  >
                    {palace.earthlyStem}
                  </text>

                  {/* 五行 */}
                  <text
                    x={rect.x + rect.w - 14}
                    y={rect.y + rect.h - 14}
                    textAnchor="end"
                    fill={ELEMENT_COLORS[palace.fiveElements] || '#6b7280'}
                    fontSize="12"
                    fontWeight="500"
                  >
                    {palace.fiveElements}
                  </text>

                  {/* 标记区 */}
                  <g>
                    {isZhiFu && (
                      <rect
                        x={rect.x + 10}
                        y={rect.y + rect.h - 28}
                        width="34"
                        height="20"
                        fill="#fef3c7"
                        stroke="#d97706"
                        strokeWidth="1"
                        rx="4"
                      />
                    )}
                    {isZhiFu && (
                      <text
                        x={rect.x + 27}
                        y={rect.y + rect.h - 13}
                        textAnchor="middle"
                        fill="#d97706"
                        fontSize="11"
                        fontWeight="600"
                      >
                        值符
                      </text>
                    )}
                    {isZhiShi && (
                      <rect
                        x={rect.x + (isZhiFu ? 48 : 10)}
                        y={rect.y + rect.h - 28}
                        width="34"
                        height="20"
                        fill="#dbeafe"
                        stroke="#2563eb"
                        strokeWidth="1"
                        rx="4"
                      />
                    )}
                    {isZhiShi && (
                      <text
                        x={rect.x + (isZhiFu ? 65 : 27)}
                        y={rect.y + rect.h - 13}
                        textAnchor="middle"
                        fill="#2563eb"
                        fontSize="11"
                        fontWeight="600"
                      >
                        值使
                      </text>
                    )}
                    {palace.voidness?.hasVoidness && (
                      <rect
                        x={rect.x + rect.w - 44}
                        y={rect.y + rect.h - 28}
                        width="34"
                        height="20"
                        fill="#f3f4f6"
                        stroke="#9ca3af"
                        strokeWidth="1"
                        rx="4"
                      />
                    )}
                    {palace.voidness?.hasVoidness && (
                      <text
                        x={rect.x + rect.w - 27}
                        y={rect.y + rect.h - 13}
                        textAnchor="middle"
                        fill="#6b7280"
                        fontSize="11"
                      >
                        空
                      </text>
                    )}
                  </g>

                  {/* 吉凶格局标记 */}
                  {palace.auspiciousPatterns && palace.auspiciousPatterns.length > 0 && (
                    <text
                      x={rect.x + rect.w - 14}
                      y={rect.y + 138}
                      textAnchor="end"
                      fill="#16a34a"
                      fontSize="10"
                      fontWeight="600"
                    >
                      吉×{palace.auspiciousPatterns.length}
                    </text>
                  )}
                  {palace.inauspiciousPatterns && palace.inauspiciousPatterns.length > 0 && (
                    <text
                      x={rect.x + 14}
                      y={rect.y + 138}
                      fill="#dc2626"
                      fontSize="10"
                      fontWeight="600"
                    >
                      凶×{palace.inauspiciousPatterns.length}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* 底部装饰线 */}
        <line
          x1="60" y1={SVG_SIZE - 25}
          x2={SVG_SIZE - 60} y2={SVG_SIZE - 25}
          stroke="#d4a574"
          strokeWidth="1"
          opacity="0.5"
        />
        <text
          x={CENTER}
          y={SVG_SIZE - 12}
          textAnchor="middle"
          fill="#d4a574"
          fontSize="10"
          letterSpacing="4"
        >
          洛书九宫 · 奇门遁甲
        </text>
      </svg>

      {/* 图例说明 */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #d97706' }} />
          <span>值符宫</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', border: '1px solid #2563eb' }} />
          <span>值使宫</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)', border: '1px solid #dc2626' }} />
          <span>选中宫</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(135deg, #991b1b, #b91c1c)', border: '1px solid #991b1b' }} />
          <span>中宫·局数</span>
        </div>
      </div>
    </div>
  );
}
