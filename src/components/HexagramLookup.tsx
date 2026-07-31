'use client';

import { useState } from 'react';
import { HEXAGRAM_DATA, type HexagramData } from '@/lib/interpretation/hexagramData';
import { ALL_YAO_DATA } from '@/lib/interpretation/meihua';
import { BAGUA, HEXAGRAMS } from '@/lib/algorithms/meihua';

const ALL_HEXAGRAM_NAMES = Object.keys(HEXAGRAM_DATA);

// 八卦符号对应
const TRIGRAM_SYMBOLS: Record<string, string> = {
  '乾': '☰', '兑': '☱', '离': '☲', '震': '☳',
  '巽': '☴', '坎': '☵', '艮': '☶', '坤': '☷'
};

// 八卦五行颜色
const TRIGRAM_COLORS: Record<string, string> = {
  '乾': '#D4AF37', '兑': '#B87333', '离': '#DC143C', '震': '#228B22',
  '巽': '#3CB371', '坎': '#1E90FF', '艮': '#8B4513', '坤': '#DAA520'
};

// 64卦总图布局（上下卦组合）
const HEXAGRAM_GRID = [
  ['乾为天', '天泽履', '天火同人', '天雷无妄', '天风姤', '天水讼', '天山遁', '天地否'],
  ['泽天夬', '兑为泽', '泽火革', '泽雷随', '泽风大过', '泽水困', '泽山咸', '泽地萃'],
  ['火天大有', '火泽睽', '离为火', '火雷噬嗑', '火风鼎', '火水未济', '火山旅', '火地晋'],
  ['雷天大壮', '雷泽归妹', '雷火丰', '震为雷', '雷风恒', '雷水解', '雷山小过', '雷地豫'],
  ['风天小畜', '风泽中孚', '风火家人', '风雷益', '巽为风', '风水涣', '风山渐', '风地观'],
  ['水天需', '水泽节', '水火既济', '水雷屯', '水风井', '坎为水', '水山蹇', '水地比'],
  ['山天大畜', '山泽损', '山火贲', '山雷颐', '山风蛊', '山水蒙', '艮为山', '山地剥'],
  ['地天泰', '地泽临', '地火明夷', '地雷复', '地风升', '地水师', '地山谦', '坤为地'],
];

// 画卦组件 - SVG
function HexagramDiagram({ hexagramName, size = 'small' }: { hexagramName: string; size?: 'small' | 'large' }) {
  const hexInfo = Object.entries(HEXAGRAMS).find(([_, v]) => v.name === hexagramName);
  if (!hexInfo) return null;
  
  const [key] = hexInfo;
  const upperIdx = parseInt(key[0]) - 1;
  const lowerIdx = parseInt(key[1]) - 1;
  const upperGua = BAGUA[upperIdx];
  const lowerGua = BAGUA[lowerIdx];
  
  const lineHeight = size === 'large' ? 16 : 10;
  const lineWidth = size === 'large' ? 80 : 40;
  const gap = size === 'large' ? 8 : 5;
  const centerY = (lineHeight + gap) * 3;
  
  const lines = [...lowerGua.lines, ...upperGua.lines];
  
  return (
    <svg 
      width={lineWidth + 20} 
      height={(lineHeight + gap) * 6} 
      viewBox={`0 0 ${lineWidth + 20} ${(lineHeight + gap) * 6}`}
      className="mx-auto"
    >
      {lines.map((line, i) => {
        const y = i * (lineHeight + gap) + 5;
        const isYang = line === 1;
        
        if (isYang) {
          return (
            <rect
              key={i}
              x={10}
              y={y}
              width={lineWidth}
              height={lineHeight}
              fill="#1a1a1a"
              rx={2}
            />
          );
        } else {
          const halfWidth = (lineWidth - 10) / 2;
          return (
            <g key={i}>
              <rect
                x={10}
                y={y}
                width={halfWidth}
                height={lineHeight}
                fill="#1a1a1a"
                rx={2}
              />
              <rect
                x={10 + halfWidth + 10}
                y={y}
                width={halfWidth}
                height={lineHeight}
                fill="#1a1a1a"
                rx={2}
              />
            </g>
          );
        }
      })}
    </svg>
  );
}

// 八卦方位图
function BaguaCompass() {
  const baguaOrder = [
    { name: '乾', position: '西北' },
    { name: '兑', position: '西' },
    { name: '离', position: '南' },
    { name: '震', position: '东' },
    { name: '巽', position: '东南' },
    { name: '坎', position: '北' },
    { name: '艮', position: '东北' },
    { name: '坤', position: '西南' },
  ];
  
  const positionStyles: Record<string, string> = {
    '西北': 'top-0 left-0',
    '西': 'top-1/2 left-0 -translate-y-1/2',
    '南': 'bottom-0 left-1/2 -translate-x-1/2',
    '东': 'top-1/2 right-0 -translate-y-1/2',
    '东南': 'bottom-0 right-0',
    '北': 'top-0 left-1/2 -translate-x-1/2',
    '东北': 'top-0 right-0',
    '西南': 'bottom-0 left-0',
  };
  
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* 中心太极 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-gray-800 via-gray-200 to-gray-800 rounded-full flex items-center justify-center text-2xl">
        ☯
      </div>
      {/* 八卦方位 */}
      {baguaOrder.map(({ name, position }) => (
        <div
          key={name}
          className={`absolute ${positionStyles[position]} text-center`}
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
            style={{ backgroundColor: TRIGRAM_COLORS[name] }}
          >
            {TRIGRAM_SYMBOLS[name]}
          </div>
          <div className="text-xs font-medium text-gray-600 mt-0.5">{name}</div>
        </div>
      ))}
      {/* 方位标注 */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400">北</div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400">南</div>
      <div className="absolute top-1/2 -left-6 -translate-y-1/2 text-xs text-gray-400">西</div>
      <div className="absolute top-1/2 -right-6 -translate-y-1/2 text-xs text-gray-400">东</div>
    </div>
  );
}

export function HexagramLookup() {
  const [selectedGua, setSelectedGua] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showYao, setShowYao] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBagua, setSelectedBagua] = useState<string | null>(null);

  const filtered = searchTerm
    ? ALL_HEXAGRAM_NAMES.filter(name => name.includes(searchTerm))
    : ALL_HEXAGRAM_NAMES;

  const detail: HexagramData | undefined = selectedGua ? HEXAGRAM_DATA[selectedGua] : undefined;
  const yaoData = selectedGua ? ALL_YAO_DATA[selectedGua] : undefined;
  const hexInfo = selectedGua ? Object.entries(HEXAGRAMS).find(([_, v]) => v.name === selectedGua) : undefined;

  // 点击八卦筛选对应的卦
  const handleBaguaClick = (baguaName: string) => {
    if (selectedBagua === baguaName) {
      setSelectedBagua(null);
      setSearchTerm('');
    } else {
      setSelectedBagua(baguaName);
      setSearchTerm(baguaName);
    }
    setSelectedGua(null);
  };

  // 渲染64卦总图
  const renderHexagramGrid = () => (
    <div className="space-y-4">
      {/* 八卦方位总图 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
        <h3 className="text-center font-bold text-amber-800 mb-4">八卦方位总图</h3>
        <BaguaCompass />
      </div>
      
      {/* 64卦总图 - 8x8网格 */}
      <div>
        <h3 className="text-center font-bold text-gray-700 mb-3">六十四卦总图</h3>
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-200">
          <div className="grid grid-cols-8 gap-1">
            {HEXAGRAM_GRID.flat().map((name, idx) => (
              <button
                key={`${name}-${idx}`}
                onClick={() => setSelectedGua(name)}
                className={`p-2 rounded-lg border text-center transition-all ${
                  selectedGua === name 
                    ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105' 
                    : 'bg-white border-gray-200 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <HexagramDiagram hexagramName={name} size="small" />
                <div className={`text-xs mt-1 font-medium ${selectedGua === name ? 'text-white' : 'text-gray-700'}`}>
                  {name.replace(/[为天地火水山泽风雷]/g, '')}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedGua(null); setSelectedBagua(null); }}
            placeholder="搜索卦名或关键字..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedGua(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {viewMode === 'grid' ? '列表视图' : '网格视图'}
        </button>
      </div>

      {/* 八卦快捷筛选 */}
      <div className="flex flex-wrap gap-2 justify-center">
        {['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'].map(bagua => (
          <button
            key={bagua}
            onClick={() => handleBaguaClick(bagua)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedBagua === bagua 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={selectedBagua === bagua ? { backgroundColor: TRIGRAM_COLORS[bagua] } : {}}
          >
            {TRIGRAM_SYMBOLS[bagua]} {bagua}
          </button>
        ))}
      </div>
    </div>
  );

  // 渲染列表视图
  const renderListView = () => (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelectedGua(null); }}
          placeholder="搜索卦名..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => { setSearchTerm(''); setSelectedGua(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
        {filtered.map((name) => (
          <button
            key={name}
            onClick={() => setSelectedGua(name)}
            className={`p-3 rounded-xl border transition-all text-center ${
              selectedGua === name 
                ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white border-transparent shadow-lg' 
                : 'bg-white border-gray-200 hover:border-red-300 hover:bg-red-50'
            }`}
          >
            <div className="flex items-center justify-center mb-2">
              <HexagramDiagram hexagramName={name} size="small" />
            </div>
            <div className={`font-bold text-sm ${selectedGua === name ? 'text-white' : 'text-gray-800'}`}>
              {name}
            </div>
            <div className={`text-xs mt-0.5 ${selectedGua === name ? 'text-white/80' : 'text-gray-500'}`}>
              {HEXAGRAM_DATA[name]?.summary.slice(0, 15)}...
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {!selectedGua && (
        viewMode === 'grid' ? renderHexagramGrid() : renderListView()
      )}

      {/* 卦详情 */}
      {selectedGua && detail && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedGua(null)}
              className="text-sm text-gray-500 hover:text-red-700 flex items-center gap-1"
            >
              ← 返回
            </button>
            <h3 className="text-xl font-bold chinese-red">{selectedGua}</h3>
            <span className="text-xs text-gray-400">
              {ALL_HEXAGRAM_NAMES.indexOf(selectedGua) + 1}/64
            </span>
          </div>

          {/* 卦图展示 */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-xl p-6 border border-amber-200">
            <div className="flex items-center justify-center gap-8">
              <div>
                <HexagramDiagram hexagramName={selectedGua} size="large" />
              </div>
              <div className="text-left">
                <div className="text-4xl font-bold text-red-700 mb-2">{selectedGua}</div>
                <div className="text-lg text-amber-800">{detail.guaCi.split('。')[0]}。</div>
                <div className="mt-4 flex gap-2">
                  {['大吉', '中吉', '小吉', '平', '小凶', '凶'].map(level => (
                    <span key={level} className={`px-2 py-1 rounded text-xs font-medium ${
                      level === '大吉' ? 'bg-green-100 text-green-700' :
                      level === '中吉' ? 'bg-blue-100 text-blue-700' :
                      level === '小吉' ? 'bg-cyan-100 text-cyan-700' :
                      level === '平' ? 'bg-gray-100 text-gray-700' :
                      level === '小凶' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {level}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 卦辞 */}
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <h4 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-red-600 rounded"></span>
              卦辞
            </h4>
            <p className="text-sm text-gray-800 leading-relaxed">{detail.guaCi}</p>
          </div>

          {/* 象曰与彖曰 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-bold text-blue-800 text-sm mb-2">象曰</h4>
              <p className="text-sm text-gray-800 leading-relaxed">{detail.xiangYue}</p>
            </div>
            {detail.tuanYue && (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="font-bold text-purple-800 text-sm mb-2">彖曰</h4>
                <p className="text-sm text-gray-800 leading-relaxed line-clamp-4">{detail.tuanYue}</p>
              </div>
            )}
          </div>

          {/* 白话解析 */}
          <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-800 text-sm mb-2">白话解析</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{detail.summary}</p>
          </div>

          {/* 运势分项 */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '💼', title: '事业', content: detail.career, bg: 'bg-blue-50 border-blue-200', color: 'text-blue-700' },
              { icon: '💰', title: '财运', content: detail.wealth, bg: 'bg-yellow-50 border-yellow-200', color: 'text-yellow-700' },
              { icon: '❤️', title: '感情', content: detail.love, bg: 'bg-pink-50 border-pink-200', color: 'text-pink-700' },
              { icon: '🏥', title: '健康', content: detail.health, bg: 'bg-green-50 border-green-200', color: 'text-green-700' },
            ].map((item) => (
              <div key={item.title} className={`p-3 rounded-xl border ${item.bg}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span>{item.icon}</span>
                  <span className={`font-bold text-sm ${item.color}`}>{item.title}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>

          {/* 建议与吉利信息 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <h4 className="font-bold text-yellow-800 text-sm mb-2">💡 处事建议</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{detail.advice}</p>
            </div>
            {detail.lucky && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <h4 className="font-bold text-green-800 text-sm mb-2">🍀 吉利信息</h4>
                <p className="text-sm text-gray-700">{detail.lucky}</p>
              </div>
            )}
          </div>

          {/* 爻辞 */}
          {yaoData && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800 text-base">六爻详解</h4>
                <button
                  onClick={() => setShowYao(!showYao)}
                  className="text-sm text-red-700 hover:underline"
                >
                  {showYao ? '收起' : '展开全部'}
                </button>
              </div>
              {showYao && (
                <div className="space-y-2">
                  {yaoData.map((yao, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {['初', '二', '三', '四', '五', '上'][i]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 mb-1 font-medium">{yao.yaoCi}</p>
                          <p className="text-xs text-blue-600 mb-1">象曰：{yao.xiangYue}</p>
                          <p className="text-xs text-gray-600">{yao.meaning}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 上下卦信息 */}
          {hexInfo && (() => {
            const [key] = hexInfo;
            return (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
              <h4 className="font-bold text-red-800 text-sm mb-3">卦象构成</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl mb-1">
                    {TRIGRAM_SYMBOLS[BAGUA[parseInt(key[1]) - 1].name]}
                  </div>
                  <div className="text-xs text-gray-500">上卦</div>
                  <div className="font-bold text-sm text-gray-700">{BAGUA[parseInt(key[1]) - 1].name}</div>
                  <div className="text-xs text-gray-500">
                    {BAGUA[parseInt(key[1]) - 1].element} · {BAGUA[parseInt(key[1]) - 1].nature}
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl mb-1">
                    {TRIGRAM_SYMBOLS[BAGUA[parseInt(key[0]) - 1].name]}
                  </div>
                  <div className="text-xs text-gray-500">下卦</div>
                  <div className="font-bold text-sm text-gray-700">{BAGUA[parseInt(key[0]) - 1].name}</div>
                  <div className="text-xs text-gray-500">
                    {BAGUA[parseInt(key[0]) - 1].element} · {BAGUA[parseInt(key[0]) - 1].nature}
                  </div>
                </div>
              </div>
            </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}