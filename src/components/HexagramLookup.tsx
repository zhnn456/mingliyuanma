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

// 八卦五行颜色 - 用于区分不同卦的颜色
const TRIGRAM_COLORS: Record<string, { bg: string; text: string; border: string; solid: string; hex: string }> = {
  '乾': { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-300', solid: 'bg-yellow-400', hex: '#FACC15' },
  '兑': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', solid: 'bg-orange-400', hex: '#FB923C' },
  '离': { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300', solid: 'bg-red-400', hex: '#F87171' },
  '震': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300', solid: 'bg-green-400', hex: '#4ADE80' },
  '巽': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', solid: 'bg-emerald-400', hex: '#34D399' },
  '坎': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', solid: 'bg-blue-400', hex: '#60A5FA' },
  '艮': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', solid: 'bg-amber-400', hex: '#FBBF24' },
  '坤': { bg: 'bg-stone-50', text: 'text-stone-800', border: 'border-stone-300', solid: 'bg-stone-400', hex: '#A8A29E' },
};

// 八卦基本信息
const BAGUA_INFO = BAGUA.map(b => ({
  name: b.name,
  symbol: b.symbol,
  element: b.element,
  nature: b.nature,
  color: TRIGRAM_COLORS[b.name]
}));

// 64卦矩阵 - 行=下卦，列=上卦（按照zhouyi.cc的布局）
// 下卦在前，上卦在后
const HEXAGRAM_MATRIX: { name: string; meaning: string }[][] = [
  // 下卦乾
  [
    { name: '乾为天', meaning: '刚健中正' },
    { name: '泽天夬', meaning: '决而能和' },
    { name: '火天大有', meaning: '顺天依时' },
    { name: '雷天大壮', meaning: '壮勿妄动' },
    { name: '风天小畜', meaning: '蓄养待进' },
    { name: '水天需', meaning: '守正待机' },
    { name: '山天大畜', meaning: '止而不止' },
    { name: '地天泰', meaning: '应时而变' },
  ],
  // 下卦兑
  [
    { name: '天泽履', meaning: '脚踏实地' },
    { name: '兑为泽', meaning: '刚内柔外' },
    { name: '火泽睽', meaning: '异中求同' },
    { name: '雷泽归妹', meaning: '立家兴业' },
    { name: '风泽中孚', meaning: '诚信立身' },
    { name: '水泽节', meaning: '万物有节' },
    { name: '山泽损', meaning: '损益制衡' },
    { name: '地泽临', meaning: '教民保民' },
  ],
  // 下卦离
  [
    { name: '天火同人', meaning: '上下和同' },
    { name: '泽火革', meaning: '顺天应人' },
    { name: '离为火', meaning: '附和依托' },
    { name: '雷火丰', meaning: '日中则斜' },
    { name: '风火家人', meaning: '诚威治业' },
    { name: '水火既济', meaning: '盛极将衰' },
    { name: '山火贲', meaning: '饰外扬质' },
    { name: '地火明夷', meaning: '晦而转明' },
  ],
  // 下卦震
  [
    { name: '天雷无妄', meaning: '无妄而得' },
    { name: '泽雷随', meaning: '随时变通' },
    { name: '火雷噬嗑', meaning: '刚柔相济' },
    { name: '震为雷', meaning: '临危不乱' },
    { name: '风雷益', meaning: '损上益下' },
    { name: '水雷屯', meaning: '起始维艰' },
    { name: '山雷颐', meaning: '纯正以养' },
    { name: '地雷复', meaning: '寓动于顺' },
  ],
  // 下卦巽
  [
    { name: '天风姤', meaning: '天下有风' },
    { name: '泽风大过', meaning: '非常行动' },
    { name: '火风鼎', meaning: '稳重图变' },
    { name: '雷风恒', meaning: '恒心有成' },
    { name: '巽为风', meaning: '谦逊受益' },
    { name: '水风井', meaning: '求贤若渴' },
    { name: '山风蛊', meaning: '振疲起衰' },
    { name: '地风升', meaning: '柔顺谦虚' },
  ],
  // 下卦坎
  [
    { name: '天水讼', meaning: '慎争戒讼' },
    { name: '泽水困', meaning: '困境求通' },
    { name: '火水未济', meaning: '事业未竟' },
    { name: '雷水解', meaning: '柔道致治' },
    { name: '风水涣', meaning: '拯救涣散' },
    { name: '坎为水', meaning: '行险用险' },
    { name: '山水蒙', meaning: '启蒙奋发' },
    { name: '地水师', meaning: '行险而顺' },
  ],
  // 下卦艮
  [
    { name: '天山遁', meaning: '遁世救世' },
    { name: '泽山咸', meaning: '相互感应' },
    { name: '火山旅', meaning: '依义顺时' },
    { name: '雷山小过', meaning: '行动有度' },
    { name: '风山渐', meaning: '渐进蓄德' },
    { name: '水山蹇', meaning: '险阻在前' },
    { name: '艮为山', meaning: '动静适时' },
    { name: '地山谦', meaning: '内高外低' },
  ],
  // 下卦坤
  [
    { name: '天地否', meaning: '不交不通' },
    { name: '泽地萃', meaning: '荟萃聚集' },
    { name: '火地晋', meaning: '求进发展' },
    { name: '雷地豫', meaning: '顺时依势' },
    { name: '风地观', meaning: '观下瞻上' },
    { name: '水地比', meaning: '诚信团结' },
    { name: '山地剥', meaning: '顺势而止' },
    { name: '坤为地', meaning: '柔顺伸展' },
  ],
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

export function HexagramLookup() {
  const [selectedGua, setSelectedGua] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showYao, setShowYao] = useState(false);
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

  const detail: HexagramData | undefined = selectedGua ? HEXAGRAM_DATA[selectedGua] : undefined;
  const yaoData = selectedGua ? ALL_YAO_DATA[selectedGua] : undefined;
  const hexInfo = selectedGua ? Object.entries(HEXAGRAMS).find(([_, v]) => v.name === selectedGua) : undefined;

  // 搜索过滤
  const filtered = searchTerm
    ? ALL_HEXAGRAM_NAMES.filter(name => name.includes(searchTerm))
    : ALL_HEXAGRAM_NAMES;

  // 渲染矩阵视图（上下卦组合）
  const renderMatrixView = () => (
    <div className="space-y-4">
      {/* 64卦矩阵图 */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
        <div className="text-center font-bold text-gray-700 mb-3">
          六十四卦总图
          <span className="text-sm font-normal text-gray-500 ml-2">上卦（外卦）+ 下卦（内卦）= 六十四卦</span>
        </div>
        
        {/* 表头 - 上卦 */}
        <div className="flex items-start">
          <div className="w-16 flex-shrink-0 pt-11">
            <div className="text-xs font-bold text-gray-500 text-center rotate-0">下卦<br/>(内卦)</div>
          </div>
          <div className="grid grid-cols-8 gap-1 flex-1">
            {BAGUA_INFO.map((b, i) => (
              <div 
                key={i} 
                className={`text-center p-2 rounded-lg ${b.color.bg} ${b.color.border} border-2 relative`}
              >
                <div className="text-xs font-bold text-gray-500 mb-0.5">上卦</div>
                <div className="text-lg">{b.symbol}</div>
                <div className={`text-xs font-bold ${b.color.text}`}>{b.name}</div>
                <div className="text-xs text-gray-400">{b.element}</div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-gray-300 text-xs">▼</div>
              </div>
            ))}
          </div>
        </div>

        {/* 表格内容 */}
        <div className="mt-3 space-y-1.5">
          {HEXAGRAM_MATRIX.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center">
              {/* 行标题 - 下卦 */}
              <div className={`w-16 flex-shrink-0 p-2 rounded-lg ${BAGUA_INFO[rowIdx].color.bg} ${BAGUA_INFO[rowIdx].color.border} border-2 text-center relative`}>
                <div className="text-xs font-bold text-gray-500 mb-0.5">下卦</div>
                <div className="text-lg">{BAGUA_INFO[rowIdx].symbol}</div>
                <div className={`text-xs font-bold ${BAGUA_INFO[rowIdx].color.text}`}>{BAGUA_INFO[rowIdx].name}</div>
                <div className="text-xs text-gray-400">{BAGUA_INFO[rowIdx].element}</div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-gray-300 text-xs">▶</div>
              </div>
              
              {/* 卦单元格 */}
              <div className="grid grid-cols-8 gap-1 ml-2 flex-1">
                {row.map((cell, colIdx) => {
                  const rowColor = TRIGRAM_COLORS[BAGUA_INFO[rowIdx].name];
                  const colColor = TRIGRAM_COLORS[BAGUA_INFO[colIdx].name];
                  const isSelected = selectedGua === cell.name;
                  
                  // 使用左边框（下卦颜色）和上边框（上卦颜色）表示组合
                  // 背景使用浅色表示组合区域
                  return (
                    <button
                      key={colIdx}
                      onClick={() => setSelectedGua(cell.name)}
                      className={`p-2 rounded-lg border-2 border-gray-200 text-center transition-all relative overflow-hidden
                        ${isSelected 
                          ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white border-red-500 shadow-lg scale-105 z-10' 
                          : 'bg-white hover:shadow-md hover:scale-102'
                        }`}
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: isSelected ? '' : rowColor.hex,
                        borderTopWidth: '4px',
                        borderTopColor: isSelected ? '' : colColor.hex,
                      }}
                    >
                      {/* 组合标记 - 显示两卦名称 */}
                      {!isSelected && (
                        <div className="absolute top-0 right-0 text-[8px] px-1 py-0.5 bg-gray-100 text-gray-400 rounded-bl">
                          {BAGUA_INFO[colIdx].name}+{BAGUA_INFO[rowIdx].name}
                        </div>
                      )}
                      <div className={`text-sm font-bold mt-1 ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {cell.name}
                      </div>
                      <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                        {cell.meaning}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 图例说明 */}
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-xs text-amber-800 mb-2 font-bold">📖 图例说明</div>
          <div className="text-xs text-amber-700 leading-relaxed">
            <span className="inline-block px-2 py-0.5 bg-gray-100 rounded mr-1">列头</span>
            为 <strong>上卦（外卦）</strong>，
            <span className="inline-block px-2 py-0.5 bg-gray-100 rounded mx-1">行头</span>
            为 <strong>下卦（内卦）</strong>，
            交叉处即为 <strong>上卦 + 下卦</strong> 组合而成的六十四卦。
          </div>
        </div>
      </div>

      {/* 控制栏 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedGua(null); }}
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
          onClick={() => setViewMode(viewMode === 'matrix' ? 'list' : 'matrix')}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {viewMode === 'matrix' ? '列表视图' : '矩阵视图'}
        </button>
      </div>

      {/* 五行颜色图例 */}
      <div className="bg-white rounded-xl p-3 border border-gray-200">
        <div className="text-xs text-gray-500 mb-2">八卦五行颜色对照：</div>
        <div className="flex flex-wrap gap-2">
          {BAGUA_INFO.map((b, i) => (
            <div key={i} className={`px-2 py-1 rounded ${b.color.bg} ${b.color.border} border text-xs ${b.color.text}`}>
              {b.symbol} {b.name}（{b.element}）
            </div>
          ))}
        </div>
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
        {filtered.map((name) => {
          const hexInfoItem = Object.entries(HEXAGRAMS).find(([_, v]) => v.name === name);
          const upperIdx = hexInfoItem ? parseInt(hexInfoItem[0][0]) - 1 : 0;
          const upperName = BAGUA[upperIdx]?.name || '乾';
          const colors = TRIGRAM_COLORS[upperName];
          
          return (
            <button
              key={name}
              onClick={() => setSelectedGua(name)}
              className={`p-3 rounded-xl border transition-all text-center ${
                selectedGua === name 
                  ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white border-transparent shadow-lg' 
                  : `${colors.bg} ${colors.border} hover:shadow-md`
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
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {!selectedGua && (
        viewMode === 'matrix' ? renderMatrixView() : renderListView()
      )}

      {/* 卦详情 */}
      {selectedGua && detail && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedGua(null)}
              className="text-sm text-gray-500 hover:text-red-700 flex items-center gap-1"
            >
              ← 返回总图
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
              </div>
            </div>
          </div>

          {/* 卦辞 */}
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <h4 className="font-bold text-red-800 text-sm mb-2">卦辞</h4>
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
            const lowerIdx = parseInt(key[1]) - 1;
            const upperIdx = parseInt(key[0]) - 1;
            const lowerColor = TRIGRAM_COLORS[BAGUA[lowerIdx].name];
            const upperColor = TRIGRAM_COLORS[BAGUA[upperIdx].name];
            return (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
                <h4 className="font-bold text-red-800 text-sm mb-3">卦象构成</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`text-center p-3 ${lowerColor.bg} rounded-lg border ${lowerColor.border}`}>
                    <div className="text-2xl mb-1">
                      {BAGUA[lowerIdx].symbol}
                    </div>
                    <div className="text-xs text-gray-500">下卦</div>
                    <div className={`font-bold text-sm ${lowerColor.text}`}>{BAGUA[lowerIdx].name}</div>
                    <div className="text-xs text-gray-500">
                      {BAGUA[lowerIdx].element} · {BAGUA[lowerIdx].nature}
                    </div>
                  </div>
                  <div className={`text-center p-3 ${upperColor.bg} rounded-lg border ${upperColor.border}`}>
                    <div className="text-2xl mb-1">
                      {BAGUA[upperIdx].symbol}
                    </div>
                    <div className="text-xs text-gray-500">上卦</div>
                    <div className={`font-bold text-sm ${upperColor.text}`}>{BAGUA[upperIdx].name}</div>
                    <div className="text-xs text-gray-500">
                      {BAGUA[upperIdx].element} · {BAGUA[upperIdx].nature}
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