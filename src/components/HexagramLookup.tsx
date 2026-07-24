'use client';

import { useState } from 'react';
import { HEXAGRAM_DATA, type HexagramData } from '@/lib/interpretation/hexagramData';
import { ALL_YAO_DATA } from '@/lib/interpretation/meihua';

const ALL_HEXAGRAM_NAMES = Object.keys(HEXAGRAM_DATA);

export function HexagramLookup() {
  const [selectedGua, setSelectedGua] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showYao, setShowYao] = useState(false);

  const filtered = searchTerm
    ? ALL_HEXAGRAM_NAMES.filter(name => name.includes(searchTerm))
    : ALL_HEXAGRAM_NAMES;

  const detail: HexagramData | undefined = selectedGua ? HEXAGRAM_DATA[selectedGua] : undefined;
  const yaoData = selectedGua ? ALL_YAO_DATA[selectedGua] : undefined;

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setSelectedGua(null); }}
          placeholder="搜索卦名，如：乾、天、火..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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

      {/* 卦列表 */}
      {!selectedGua && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-80 overflow-y-auto">
          {filtered.map((name) => (
            <button
              key={name}
              onClick={() => setSelectedGua(name)}
              className="px-2 py-1.5 text-xs bg-white border border-gray-200 rounded hover:bg-red-50 hover:border-red-300 transition-colors text-center truncate"
              title={name}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* 卦详情 */}
      {selectedGua && detail && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedGua(null)}
              className="text-sm text-gray-500 hover:text-red-700 flex items-center gap-1"
            >
              ← 返回列表
            </button>
            <h3 className="text-lg font-bold chinese-red">{selectedGua}</h3>
          </div>

          {/* 卦辞 */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-bold text-red-800 text-sm mb-2">卦辞</h4>
            <p className="text-sm text-gray-800 leading-relaxed">{detail.guaCi}</p>
          </div>

          {/* 象曰 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-800 text-sm mb-2">象曰</h4>
            <p className="text-sm text-gray-800 leading-relaxed">{detail.xiangYue}</p>
          </div>

          {/* 彖曰 */}
          {detail.tuanYue && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-bold text-purple-800 text-sm mb-2">彖曰</h4>
              <p className="text-sm text-gray-800 leading-relaxed">{detail.tuanYue}</p>
            </div>
          )}

          {/* 白话解析 */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-bold text-gray-800 text-sm mb-2">白话解析</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{detail.summary}</p>
          </div>

          {/* 运势分项 */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '💼', title: '事业', content: detail.career, bg: 'bg-blue-50 border-blue-200' },
              { icon: '💰', title: '财运', content: detail.wealth, bg: 'bg-yellow-50 border-yellow-200' },
              { icon: '❤️', title: '感情', content: detail.love, bg: 'bg-pink-50 border-pink-200' },
              { icon: '🏥', title: '健康', content: detail.health, bg: 'bg-green-50 border-green-200' },
            ].map((item) => (
              <div key={item.title} className={`p-3 rounded-lg border ${item.bg}`}>
                <div className="flex items-center gap-1 mb-1">
                  <span>{item.icon}</span>
                  <span className="font-bold text-sm text-gray-700">{item.title}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>

          {/* 建议 */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-bold text-yellow-800 text-sm mb-2">建议</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{detail.advice}</p>
          </div>

          {/* 吉利信息 */}
          {detail.lucky && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-800 text-sm mb-2">吉利信息</h4>
              <p className="text-sm text-gray-700">{detail.lucky}</p>
            </div>
          )}

          {/* 爻辞 */}
          {yaoData && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800">爻辞详解</h4>
                <button
                  onClick={() => setShowYao(!showYao)}
                  className="text-sm text-red-700 hover:underline"
                >
                  {showYao ? '收起' : '展开'}
                </button>
              </div>
              {showYao && (
                <div className="space-y-3">
                  {yaoData.map((yao, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="font-bold text-red-700 text-sm mb-1">
                        {['初', '二', '三', '四', '五', '上'][i]}爻
                      </div>
                      <p className="text-sm text-gray-800 mb-1">{yao.yaoCi}</p>
                      <p className="text-xs text-blue-600 mb-1">象曰：{yao.xiangYue}</p>
                      <p className="text-xs text-gray-600">{yao.meaning}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
