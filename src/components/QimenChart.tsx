'use client';

import React, { useRef, useState } from 'react';

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
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const SVG_SIZE = 800;
  const PALACE_SIZE = 230;
  const GAP = 10;
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

  const handleDownloadPNG = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SVG_SIZE * 2;
      canvas.height = SVG_SIZE * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(2, 2);
      ctx.fillStyle = '#fef9f0';
      ctx.fillRect(0, 0, SVG_SIZE, SVG_SIZE);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      const link = document.createElement('a');
      link.download = `奇门遁甲排盘_${result.timeInfo.solarDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  };

  const zoomIn = () => setScale(s => Math.min(s + 0.1, 2));
  const zoomOut = () => setScale(s => Math.max(s - 0.1, 0.5));
  const zoomReset = () => setScale(1);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const chartContent = (
    <svg
      ref={svgRef}
      width={SVG_SIZE}
      height={SVG_SIZE}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      className="max-w-full"
      style={{ filter: 'drop-shadow(0 4px 20px rgba(139, 0, 0, 0.2))' }}
    >
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9f0" />
          <stop offset="50%" stopColor="#fdf4e3" />
          <stop offset="100%" stopColor="#fef9f0" />
        </linearGradient>
        
        <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#991b1b" />
          <stop offset="50%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>

        <linearGradient id="zhiFuHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>

        <linearGradient id="zhiShiHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#bfdbfe" />
        </linearGradient>

        <linearGradient id="selectedHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fee2e2" />
          <stop offset="100%" stopColor="#fecaca" />
        </linearGradient>

        <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4a574" />
          <stop offset="50%" stopColor="#f4d4a0" />
          <stop offset="100%" stopColor="#d4a574" />
        </linearGradient>

        <pattern id="paperTexture" patternUnits="userSpaceOnUse" width="100" height="100">
          <rect width="100" height="100" fill="#fef9f0" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="#d4a574" strokeWidth="0.5" opacity="0.1" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#d4a574" strokeWidth="0.5" opacity="0.1" />
        </pattern>

        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* 背景 */}
      <rect x="0" y="0" width={SVG_SIZE} height={SVG_SIZE} fill="url(#bgGradient)" />
      
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
                x={rect.x + 5}
                y={rect.y + 5}
                width={rect.w - 10}
                height={rect.h - 10}
                fill="none"
                stroke={isZhiFu ? '#d97706' : isZhiShi ? '#2563eb' : '#d4a574'}
                strokeWidth="1"
                rx="2"
                opacity="0.5"
                strokeDasharray="3,3"
              />
            )}

            {isCenter ? (
              /* 中宫 - 完整起盘信息 */
              <g>
                {/* 中宫装饰圆 */}
                <circle
                  cx={rect.x + rect.w / 2}
                  cy={rect.y + rect.h / 2}
                  r="85"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  opacity="0.6"
                />
                <circle
                  cx={rect.x + rect.w / 2}
                  cy={rect.y + rect.h / 2}
                  r="70"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1"
                  opacity="0.4"
                  strokeDasharray="4,4"
                />
                
                {/* 顶部：阴遁/阳遁 + 局数 */}
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 40}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="18"
                  fontWeight="500"
                >
                  {result.ju.type}遁
                </text>
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 85}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="60"
                  fontWeight="bold"
                  style={{ fontFamily: 'Noto Serif SC, STSong, serif' }}
                >
                  {result.ju.number}
                </text>
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 115}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="22"
                >
                  局
                </text>
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 145}
                  textAnchor="middle"
                  fill="#fef3c7"
                  fontSize="16"
                >
                  {result.yuan}
                </text>
                
                {/* 分隔线 */}
                <line
                  x1={rect.x + 40}
                  y1={rect.y + 160}
                  x2={rect.x + rect.w - 40}
                  y2={rect.y + 160}
                  stroke="#fbbf24"
                  strokeWidth="0.8"
                  opacity="0.4"
                />
                
                {/* 值符值使信息 */}
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 185}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="14"
                >
                  值符·{result.zhiFu.star}
                </text>
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 205}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="14"
                >
                  值使·{result.zhiShi.gate}
                </text>
              </g>
            ) : (
              /* 其他宫位 - 纵向堆叠布局 */
              <g>
                {/* 第一行：宫名 + 方位 */}
                <text
                  x={rect.x + 12}
                  y={rect.y + 24}
                  fill="#991b1b"
                  fontSize="18"
                  fontWeight="bold"
                  style={{ fontFamily: 'Noto Serif SC, serif' }}
                >
                  {palace.trigram}宫
                </text>
                <text
                  x={rect.x + rect.w - 12}
                  y={rect.y + 24}
                  textAnchor="end"
                  fill="#9ca3af"
                  fontSize="11"
                >
                  {TRIGRAM_DIRECTION[palace.trigram] || ''}·{pos}宫
                </text>

                {/* 第二行：八神 */}
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 48}
                  textAnchor="middle"
                  fill="#7c3aed"
                  fontSize="15"
                  fontWeight="600"
                >
                  {palace.deity}
                </text>

                {/* 第三行：九星 + 马星标记 */}
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 72}
                  textAnchor="middle"
                  fill="#1d4ed8"
                  fontSize="15"
                >
                  {palace.star}
                  {palace.horse ? ' 㐂' : ''}
                </text>

                {/* 第四行：八门（带颜色） */}
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 96}
                  textAnchor="middle"
                  fill={GATE_COLORS[palace.gate] || '#374151'}
                  fontSize="16"
                  fontWeight="600"
                >
                  {palace.gate}
                </text>

                {/* 分隔线 */}
                <line
                  x1={rect.x + 20}
                  y1={rect.y + 108}
                  x2={rect.x + rect.w - 20}
                  y2={rect.y + 108}
                  stroke="#d4a574"
                  strokeWidth="0.8"
                  opacity="0.4"
                />

                {/* 第五行：天盘干（大字红色） */}
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 138}
                  textAnchor="middle"
                  fill="#dc2626"
                  fontSize="28"
                  fontWeight="bold"
                  style={{ fontFamily: 'Noto Serif SC, serif' }}
                >
                  {palace.heavenlyStem}
                </text>

                {/* 第六行：地盘干（灰色小字） */}
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + 165}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize="22"
                  style={{ fontFamily: 'Noto Serif SC, serif' }}
                >
                  {palace.earthlyStem}
                </text>

                {/* 底部信息区：五行 + 吉凶标记 */}
                {/* 五行 */}
                <text
                  x={rect.x + rect.w - 12}
                  y={rect.y + rect.h - 32}
                  textAnchor="end"
                  fill={ELEMENT_COLORS[palace.fiveElements] || '#6b7280'}
                  fontSize="12"
                  fontWeight="500"
                >
                  {palace.fiveElements}
                </text>

                {/* 吉凶格局标记 */}
                {palace.auspiciousPatterns && palace.auspiciousPatterns.length > 0 && (
                  <text
                    x={rect.x + rect.w - 12}
                    y={rect.y + rect.h - 14}
                    textAnchor="end"
                    fill="#16a34a"
                    fontSize="11"
                    fontWeight="600"
                  >
                    吉×{palace.auspiciousPatterns.length}
                  </text>
                )}
                {palace.inauspiciousPatterns && palace.inauspiciousPatterns.length > 0 && (
                  <text
                    x={rect.x + 12}
                    y={rect.y + rect.h - 14}
                    fill="#dc2626"
                    fontSize="11"
                    fontWeight="600"
                  >
                    凶×{palace.inauspiciousPatterns.length}
                  </text>
                )}

                {/* 值符/值使/空 标记 */}
                <g>
                  {isZhiFu && (
                    <rect
                      x={rect.x + 8}
                      y={rect.y + rect.h - 30}
                      width="32"
                      height="18"
                      fill="#fef3c7"
                      stroke="#d97706"
                      strokeWidth="1"
                      rx="3"
                    />
                  )}
                  {isZhiFu && (
                    <text
                      x={rect.x + 24}
                      y={rect.y + rect.h - 17}
                      textAnchor="middle"
                      fill="#d97706"
                      fontSize="10"
                      fontWeight="600"
                    >
                      值符
                    </text>
                  )}
                  {isZhiShi && (
                    <rect
                      x={rect.x + (isZhiFu ? 44 : 8)}
                      y={rect.y + rect.h - 30}
                      width="32"
                      height="18"
                      fill="#dbeafe"
                      stroke="#2563eb"
                      strokeWidth="1"
                      rx="3"
                    />
                  )}
                  {isZhiShi && (
                    <text
                      x={rect.x + (isZhiFu ? 60 : 24)}
                      y={rect.y + rect.h - 17}
                      textAnchor="middle"
                      fill="#2563eb"
                      fontSize="10"
                      fontWeight="600"
                    >
                      值使
                    </text>
                  )}
                  {palace.voidness?.hasVoidness && (
                    <rect
                      x={rect.x + rect.w - 42}
                      y={rect.y + rect.h - 30}
                      width="32"
                      height="18"
                      fill="#f3f4f6"
                      stroke="#9ca3af"
                      strokeWidth="1"
                      rx="3"
                    />
                  )}
                  {palace.voidness?.hasVoidness && (
                    <text
                      x={rect.x + rect.w - 26}
                      y={rect.y + rect.h - 17}
                      textAnchor="middle"
                      fill="#6b7280"
                      fontSize="10"
                    >
                      空
                    </text>
                  )}
                </g>
              </g>
            )}
          </g>
        );
      })}

      {/* 底部装饰 */}
      <line
        x1="60" y1={SVG_SIZE - 30}
        x2={SVG_SIZE - 60} y2={SVG_SIZE - 30}
        stroke="#d4a574"
        strokeWidth="1"
        opacity="0.5"
      />
      <text
        x={CENTER}
        y={SVG_SIZE - 15}
        textAnchor="middle"
        fill="#d4a574"
        fontSize="11"
        letterSpacing="4"
      >
        洛书九宫 · 奇门遁甲
      </text>
    </svg>
  );

  return (
    <div className="flex flex-col items-center w-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
        <button
          onClick={zoomOut}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          title="缩小"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="text-sm text-gray-600 min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          title="放大"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={zoomReset}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
          title="重置"
        >
          100%
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          onClick={handleDownloadPNG}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 flex items-center gap-1"
          title="下载PNG"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          下载
        </button>
        <button
          onClick={toggleFullscreen}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 flex items-center gap-1"
          title={isFullscreen ? '退出全屏' : '全屏查看'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isFullscreen ? (
              <path d="M8 3v4a1 1 0 01-1 1H3m18 0h-4a1 1 0 01-1-1V3M3 16h4a1 1 0 011 1v4m18 0v-4a1 1 0 00-1-1" />
            ) : (
              <path d="M3 8V5a2 2 0 012-2h3m13 0h-3m3 0v3m0 10v3a2 2 0 01-2 2h-3m-5 0H5a2 2 0 01-2-2v-3" />
            )}
          </svg>
          {isFullscreen ? '退出' : '全屏'}
        </button>
      </div>

      {/* 起盘信息标题 */}
      <div className="mb-4 text-center">
        <div className="inline-block relative">
          <h2 className="text-2xl font-bold text-red-800 tracking-wider" style={{ fontFamily: 'Noto Serif SC, STSong, serif' }}>
            {result.ju.type}{result.ju.number}局 · {result.yuan}
          </h2>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-40 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent" />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
          <span className="px-2 py-1 bg-amber-100 rounded-full text-amber-700">
            节气: {result.timeInfo.solarTerm || '-'}
          </span>
          <span className="px-2 py-1 bg-purple-100 rounded-full text-purple-700">
            旬首: {result.timeInfo.xunShou}
          </span>
          <span className="px-2 py-1 bg-red-100 rounded-full text-red-700">
            空亡: {result.timeInfo.voidness?.join('、') || '无'}
          </span>
          <span className="px-2 py-1 bg-blue-100 rounded-full text-blue-700">
            阳历: {result.timeInfo.solarDate}
          </span>
          <span className="px-2 py-1 bg-green-100 rounded-full text-green-700">
            农历: {result.timeInfo.lunarDate}
          </span>
        </div>
      </div>

      {/* 盘面容器 */}
      <div 
        className={`${isFullscreen ? 'fixed inset-0 bg-white z-50 flex items-center justify-center overflow-auto' : 'overflow-x-auto'}`}
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center', transition: 'transform 0.2s' }}
      >
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            退出全屏 ✕
          </button>
        )}
        {chartContent}
      </div>

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