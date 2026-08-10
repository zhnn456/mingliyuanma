'use client';

import { generateBaziInterpretation } from '@/lib/interpretation/bazi';

interface InterpretationProps {
  dayGan: string;
  wuxing: Record<string, number>;
  xiYongShen: { xi: string; yong: string; ji: string };
  nayin: Record<string, string>;
  shengxiao: string;
}

function getWuxingColor(wx: string): string {
  const map: Record<string, string> = { '金': '#c8a45c', '木': '#2d8c3c', '水': '#1a5276', '火': '#c41a1a', '土': '#8b6914' };
  return map[wx] || '#666';
}

function getWuxingBg(wx: string): string {
  const map: Record<string, string> = { '金': 'bg-yellow-50 border-yellow-200', '木': 'bg-green-50 border-green-200', '水': 'bg-blue-50 border-blue-200', '火': 'bg-red-50 border-red-200', '土': 'bg-amber-50 border-amber-200' };
  return map[wx] || 'bg-gray-50 border-gray-200';
}

export function BaziInterpretation({ dayGan, wuxing, xiYongShen, nayin, shengxiao }: InterpretationProps) {
  const interpretation = generateBaziInterpretation(dayGan, wuxing, xiYongShen, nayin);
  if (!interpretation) return null;

  const { dayMaster, wuxingAnalysis, missing, nayinInterpretation, yearNayin, overallSummary } = interpretation;

  return (
    <div className="space-y-6">
      {/* 日主详解 */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: getWuxingColor(dayMaster.nature.charAt(0) === '阳' ? dayMaster.nature.charAt(0) : '红') }}>
            {dayGan}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{dayMaster.title}</h2>
            <p className="text-sm text-gray-500">{dayMaster.nature}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-gray-800 mb-2">性格解析</h3>
          <p className="text-gray-700 leading-relaxed text-sm">{dayMaster.personality}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-bold text-green-800 mb-2 text-sm">核心优势</h4>
            <p className="text-green-700 text-sm">{dayMaster.strength}</p>
          </div>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-bold text-orange-800 mb-2 text-sm">需注意</h4>
            <p className="text-orange-700 text-sm">{dayMaster.weakness}</p>
          </div>
        </div>
      </div>

      {/* 人生各方面详解 */}
      <div className="card">
        <h2 className="card-title">人生运势详解</h2>
        <div className="space-y-4">
          {[
            { icon: '💼', title: '事业运', content: dayMaster.career, color: 'border-blue-200 bg-blue-50' },
            { icon: '💰', title: '财运', content: dayMaster.wealth, color: 'border-yellow-200 bg-yellow-50' },
            { icon: '❤️', title: '婚姻感情', content: dayMaster.marriage, color: 'border-pink-200 bg-pink-50' },
            { icon: '🏥', title: '健康养生', content: dayMaster.health, color: 'border-green-200 bg-green-50' },
            { icon: '💡', title: '开运建议', content: dayMaster.advice, color: 'border-purple-200 bg-purple-50' },
          ].map((item) => (
            <div key={item.title} className={`p-4 rounded-lg border ${item.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{item.icon}</span>
                <h3 className="font-bold text-gray-800 text-sm">{item.title}</h3>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 幸运指南 */}
      <div className="card">
        <h2 className="card-title">幸运指南</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-b from-gray-50 to-white rounded-lg border">
            <div className="text-2xl mb-2">🎨</div>
            <div className="text-xs text-gray-500 mb-1">幸运颜色</div>
            <div className="font-bold text-sm text-gray-800">{dayMaster.lucky.color}</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-b from-gray-50 to-white rounded-lg border">
            <div className="text-2xl mb-2">🔢</div>
            <div className="text-xs text-gray-500 mb-1">幸运数字</div>
            <div className="font-bold text-sm text-gray-800">{dayMaster.lucky.number}</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-b from-gray-50 to-white rounded-lg border">
            <div className="text-2xl mb-2">🧭</div>
            <div className="text-xs text-gray-500 mb-1">有利方位</div>
            <div className="font-bold text-sm text-gray-800">{dayMaster.lucky.direction}</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-b from-gray-50 to-white rounded-lg border">
            <div className="text-2xl mb-2">🌺</div>
            <div className="text-xs text-gray-500 mb-1">幸运花</div>
            <div className="font-bold text-sm text-gray-800">{dayMaster.lucky.flower}</div>
          </div>
        </div>
      </div>

      {/* 纳音解读 */}
      {nayinInterpretation && (
        <div className="card">
          <h2 className="card-title">年命纳音</h2>
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-yellow-50 rounded-lg border border-red-100">
            <div className="text-center">
              <div className="text-3xl font-bold chinese-red">{yearNayin}</div>
              <div className="text-xs text-gray-500 mt-1">年命纳音</div>
            </div>
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed">{nayinInterpretation}</p>
            </div>
          </div>
        </div>
      )}

      {/* 五行旺衰分析 */}
      {wuxingAnalysis && (
        <div className="card">
          <h2 className="card-title">五行旺衰详解</h2>
          <div className={`p-4 rounded-lg border ${getWuxingBg(Object.keys(wuxing).sort((a, b) => wuxing[b] - wuxing[a])[0])}`}>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">{wuxingAnalysis.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">●</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">事业方向</div>
                  <div className="text-xs text-gray-600">{wuxingAnalysis.career}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">●</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">财运特点</div>
                  <div className="text-xs text-gray-600">{wuxingAnalysis.wealth}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">●</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">健康提醒</div>
                  <div className="text-xs text-gray-600">{wuxingAnalysis.health}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">●</span>
                <div>
                  <div className="text-xs font-bold text-gray-700">性格特征</div>
                  <div className="text-xs text-gray-600">{wuxingAnalysis.personality}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 五行缺失提醒 */}
      {missing.length > 0 && (
        <div className="card border-2 border-dashed border-orange-300">
          <h2 className="card-title text-orange-700">五行缺补建议</h2>
          <div className="space-y-3">
            {missing.map(([wx]) => {
              const suggestions: Record<string, { food: string; color: string; activity: string; place: string }> = {
                '金': { food: '白色食物（白萝卜、梨、百合）', color: '白色、银色', activity: '佩戴金属饰品', place: '西方' },
                '木': { food: '绿色蔬菜（菠菜、西兰花）', color: '绿色、青色', activity: '多接触植物花草', place: '东方' },
                '水': { food: '黑色食物（黑豆、黑芝麻）', color: '黑色、深蓝色', activity: '游泳、泡温泉', place: '北方' },
                '火': { food: '红色食物（红枣、番茄）', color: '红色、紫色', activity: '适当晒太阳', place: '南方' },
                '土': { food: '黄色食物（南瓜、玉米）', color: '黄色、棕色', activity: '登山、接触泥土', place: '中央/西南' },
              };
              const s = suggestions[wx] || { food: '', color: '', activity: '', place: '' };
              return (
                <div key={wx} className={`p-4 rounded-lg border ${getWuxingBg(wx)}`}>
                  <div className="font-bold text-sm mb-2" style={{ color: getWuxingColor(wx) }}>
                    五行缺{wx}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div><span className="text-gray-500">食补：</span>{s.food}</div>
                    <div><span className="text-gray-500">颜色：</span>{s.color}</div>
                    <div><span className="text-gray-500">活动：</span>{s.activity}</div>
                    <div><span className="text-gray-500">方位：</span>{s.place}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 综合总结 */}
      <div className="card bg-gradient-to-br from-red-50 via-white to-yellow-50 border-red-200">
        <h2 className="card-title chinese-red">命理综合总结</h2>
        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
          {overallSummary}
        </div>
      </div>

      {/* 免责声明 */}
      <div className="text-center text-xs text-gray-400 py-2">
        以上命理解读内容仅供传统文化娱乐参考，不构成任何决策建议
      </div>
    </div>
  );
}
