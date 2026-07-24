'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { generateZiweiInterpretation, PALACE_MEANING, MAIN_STAR_INTERPRETATION } from '@/lib/interpretation/ziwei';
import { PaipanForm } from '@/components/PaipanForm';
import { useToast } from '@/components/Toast';

interface Star {
  name: string;
  type: string;
  mutagen: string;
  brightness: string;
}

interface Palace {
  name: string;
  index: number;
  majorStars: Star[];
  minorStars: Star[];
  isBody: boolean;
}

interface ZiweiResult {
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

// 地支顺序索引
const BRANCH_ORDER = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

// 宫位在4x4网格中的位置 (row, col)
const GRID_POSITIONS: Record<number, { row: number; col: number }> = {
  0: { row: 3, col: 0 },  // 寅
  1: { row: 2, col: 0 },  // 卯
  2: { row: 1, col: 0 },  // 辰
  3: { row: 0, col: 0 },  // 巳
  4: { row: 0, col: 1 },  // 午
  5: { row: 0, col: 2 },  // 未
  6: { row: 0, col: 3 },  // 申
  7: { row: 1, col: 3 },  // 酉
  8: { row: 2, col: 3 },  // 戌
  9: { row: 3, col: 3 },  // 亥
  10: { row: 3, col: 2 }, // 子
  11: { row: 3, col: 1 }, // 丑
};

// 十二宫地支名称
const BRANCH_NAMES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

// 三方四正关系：每个宫位的三合宫和对宫
const SANFANG: Record<number, number[]> = {
  0: [4, 8, 6],    // 寅：午宫(4)、戌宫(8)、申宫(6)
  1: [5, 9, 7],    // 卯：未宫(5)、亥宫(9)、酉宫(7)
  2: [6, 10, 8],   // 辰：申宫(6)、子宫(10)、戌宫(8)
  3: [7, 11, 9],   // 巳：酉宫(7)、丑宫(11)、亥宫(9)
  4: [0, 8, 10],   // 午：寅宫(0)、戌宫(8)、子宫(10)
  5: [1, 9, 11],   // 未：卯宫(1)、亥宫(9)、丑宫(11)
  6: [2, 10, 0],   // 申：辰宫(2)、子宫(10)、寅宫(0)
  7: [3, 11, 1],   // 酉：巳宫(3)、丑宫(11)、卯宫(1)
  8: [4, 0, 2],    // 戌：午宫(4)、寅宫(0)、辰宫(2)
  9: [5, 1, 3],    // 亥：未宫(5)、卯宫(1)、巳宫(3)
  10: [6, 2, 4],   // 子：申宫(6)、辰宫(2)、午宫(4)
  11: [7, 3, 5],   // 丑：酉宫(7)、巳宫(3)、未宫(5)
};

// 计算大限 (简化版：阳男阴女顺行，阴男阳女逆行)
function calculateAgeLimits(fiveElementsClass: string, gender: string, soulBranch: string): [number, number][] {
  const juMap: Record<string, number> = { '水二局': 2, '木三局': 3, '金四局': 4, '土五局': 5, '火六局': 6 };
  const baseAge = juMap[fiveElementsClass] || 4;
  
  const soulIdx = BRANCH_ORDER.indexOf(soulBranch);
  const isMale = gender === '男' || gender === 'male';
  const yearGan = soulBranch; // simplified
  const isForward = isMale; // simplified

  const limits: [number, number][] = [];
  for (let i = 0; i < 12; i++) {
    const startAge = baseAge + i * 10;
    limits.push([startAge, startAge + 9]);
  }
  // 根据命宫地支调整起始位置
  if (soulIdx >= 0) {
    const rotated = [...limits.slice(soulIdx), ...limits.slice(0, soulIdx)];
    return isForward ? rotated : [...limits.slice(soulIdx), ...limits.slice(0, soulIdx)];
  }
  return limits;
}

// 星曜分组
function isMajorStar(name: string): boolean {
  const majors = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
  return majors.some(m => name.includes(m));
}

function isJiStar(name: string): boolean {
  const jis = ['左辅', '右弼', '文昌', '文曲', '天魁', '天钺'];
  return jis.some(m => name.includes(m));
}

function isShaStar(name: string): boolean {
  const shas = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
  return shas.some(m => name.includes(m));
}

function getStarLevel(name: string): string {
  if (isMajorStar(name)) return '甲级';
  if (isJiStar(name)) return '乙级';
  if (isShaStar(name)) return '丙级';
  return '丁级';
}

function getStarColorClass(name: string): string {
  const jiStars = ['紫微', '天府', '太阳', '太阴', '天相', '天梁', '天同', '左辅', '右弼', '文昌', '文曲', '天魁', '天钺'];
  const xiongStars = ['七杀', '破军', '贪狼', '廉贞', '巨门', '擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
  if (jiStars.some(s => name.includes(s))) return 'text-red-700';
  if (xiongStars.some(s => name.includes(s))) return 'text-blue-700';
  return 'text-gray-600';
}

// 检测星曜组合
function detectCombinations(palaces: Palace[]): string[] {
  const combos: string[] = [];
  const allStarNames = palaces.flatMap(p => p.majorStars.map(s => s.name));
  const allNames = allStarNames.join('');

  // 杀破狼
  if (['七杀', '破军', '贪狼'].every(s => allNames.includes(s))) combos.push('杀破狼格局 - 变动创新，白手起家');
  // 府相朝垣
  if (allNames.includes('天府') && allNames.includes('天相')) combos.push('府相朝垣 - 稳重有成，贵人相助');
  // 紫府同宫
  if (allNames.includes('紫微') && allNames.includes('天府')) combos.push('紫府同宫 - 帝王之气，领导才能');
  // 日月同宫
  if (allNames.includes('太阳') && allNames.includes('太阴')) combos.push('日月同宫 - 阴阳调和，福禄双全');
  // 机月同梁
  if (['天机', '太阴', '天同', '天梁'].filter(s => allNames.includes(s)).length >= 3) combos.push('机月同梁 - 智慧超群，适合策划研究');
  // 巨日同宫
  if (allNames.includes('巨门') && allNames.includes('太阳')) combos.push('巨日同宫 - 口才出众，名扬四方');

  return combos;
}

export default function ZiweiPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [result, setResult] = useState<ZiweiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPalaceIdx, setSelectedPalaceIdx] = useState<number | null>(null);
  const [showInterpretation, setShowInterpretation] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    if (session && !initialLoaded) {
      setInitialLoaded(true);
      fetch('/api/user/latest?type=ziwei')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.record?.result) {
            setResult(data.record.result);
          }
        })
        .catch(() => {});
    }
  }, [session, initialLoaded]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ziwei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: data.year, month: data.month, day: data.day, hour: data.hour, gender: data.gender, isLunar: data.isLunar }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || '排盘失败');
      setResult(json.result);
      setSelectedPalaceIdx(null);
      setShowInterpretation(true);
      addToast('success', '紫微斗数排盘完成！');
    } catch (err: any) {
      const msg = err.message || '排盘失败';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  // 计算大限
  const ageLimits = useMemo(() => {
    if (!result) return [];
    return calculateAgeLimits(
      result.basic.fiveElementsClass,
      result.basic.gender,
      result.basic.earthlyBranchOfSoulPalace
    );
  }, [result]);

  // 三方四正
  const sanfangPalaces = useMemo(() => {
    if (selectedPalaceIdx === null || !result) return [];
    return SANFANG[selectedPalaceIdx] || [];
  }, [selectedPalaceIdx, result]);

  // 星曜组合
  const combinations = useMemo(() => {
    if (!result) return [];
    return detectCombinations(result.palaces);
  }, [result]);

  const interpretation = result ? generateZiweiInterpretation(result.palaces, result.basic) : null;

  const selectedPalace = selectedPalaceIdx !== null ? result?.palaces.find(p => p.index === selectedPalaceIdx) : null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="section-title">
            <span>紫微斗数排盘</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">紫微斗数，位列&ldquo;五大神数&rdquo;之首。以十二宫星曜分布，推演人生命运轨迹。</p>
        </div>

        {/* 输入表单 */}
        <div className="card mb-8">
          <PaipanForm onSubmit={handleSubmit} loading={loading} submitText="开始排盘" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* 功能切换 */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowInterpretation(true)}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${showInterpretation ? 'bg-red-700 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-parchment-100 border border-parchment-200'}`}
              >
                详细解析
              </button>
              <button
                onClick={() => setShowInterpretation(false)}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${!showInterpretation ? 'bg-red-700 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-parchment-100 border border-parchment-200'}`}
              >
                纯命盘
              </button>
            </div>

            {/* 命盘基本信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '农历', value: result.basic.lunarDate, color: '' },
                { label: '四柱八字', value: result.basic.chineseDate, color: '' },
                { label: '五行局', value: result.basic.fiveElementsClass, color: 'chinese-red' },
                { label: '生肖', value: result.basic.zodiac, color: '' },
                { label: '命主', value: result.basic.soul || '--', color: 'text-blue-700' },
                { label: '身主', value: result.basic.body || '--', color: 'text-purple-700' },
                { label: '命宫', value: result.basic.earthlyBranchOfSoulPalace || '--', color: 'text-yellow-700' },
                { label: '身宫', value: result.basic.earthlyBranchOfBodyPalace || '--', color: 'text-green-700' },
              ].map((item) => (
                <div key={item.label} className="card !p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className={`font-bold ${item.color || 'text-gray-900'}`}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* 星曜组合提示 */}
            {combinations.length > 0 && (
              <div className="card !p-4 border-l-4 border-l-red-500">
                <div className="text-sm font-bold text-gray-800 mb-2">⭐ 命盘格局</div>
                <div className="space-y-1">
                  {combinations.map((c, i) => (
                    <div key={i} className="text-sm text-gray-700">{c}</div>
                  ))}
                </div>
              </div>
            )}

            {/* 十二宫命盘 - 4x4 网格 */}
            <div className="card !p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-red-800 to-red-900 text-white px-4 py-3">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-serif), serif' }}>十二宫命盘</h2>
                <p className="text-xs text-red-200 mt-0.5">点击宫位查看详情 · 红色高亮为三方四正</p>
              </div>
              <div className="grid grid-cols-4 gap-0">
                {/* 中宫信息区 */}
                <div className="bg-red-800 text-white flex items-center justify-center p-2 min-h-[140px] border border-red-700 col-span-2 row-span-2">
                  <div className="text-center">
                    <div className="font-bold text-lg" style={{ fontFamily: 'var(--font-serif), serif' }}>紫微斗数</div>
                    <div className="text-xs mt-1 opacity-80">{result.basic.chineseDate}</div>
                    <div className="text-xs opacity-80">{result.basic.fiveElementsClass}</div>
                    <div className="text-xs mt-1 opacity-60">{result.basic.gender === '男' ? '乾造' : '坤造'}</div>
                    <div className="w-8 h-8 mx-auto mt-2 border border-white/30 rounded-full flex items-center justify-center text-sm opacity-60">☯</div>
                  </div>
                </div>

                {/* 十二宫位 */}
                {Array.from({ length: 12 }).map((_, branchIdx) => {
                  const pos = GRID_POSITIONS[branchIdx];
                  if (!pos) return null;

                  const palace = result.palaces.find(p => p.index === branchIdx);
                  if (!palace) return null;

                  const isSelected = selectedPalaceIdx === branchIdx;
                  const isSanfang = sanfangPalaces.includes(branchIdx);
                  const isHighlighted = isSelected || isSanfang;

                  return (
                    <div
                      key={branchIdx}
                      onClick={() => setSelectedPalaceIdx(isSelected ? null : branchIdx)}
                      className={`p-1.5 min-h-[140px] border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-red-100 border-red-500 ring-2 ring-red-400 z-10'
                          : isSanfang
                          ? 'bg-yellow-50 border-yellow-400'
                          : palace.isBody
                          ? 'bg-blue-50/60 border-parchment-200'
                          : 'bg-white border-parchment-200 hover:bg-parchment-50'
                      }`}
                    >
                      {/* 宫位头 */}
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-bold text-xs ${isSelected ? 'text-red-700' : 'text-red-700'}`}>
                          {palace.name}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {palace.isBody && <span className="text-[10px] text-blue-600 bg-blue-100 px-1 rounded">身</span>}
                          {ageLimits[branchIdx] && (
                            <span className="text-[9px] text-gray-400 bg-gray-100 px-1 rounded">
                              {ageLimits[branchIdx][0]}-{ageLimits[branchIdx][1]}岁
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 主星 */}
                      <div className="space-y-0.5">
                        {palace.majorStars.map((star, si) => (
                          <div key={si} className={`text-[11px] font-medium leading-tight ${getStarColorClass(star.name)}`}>
                            {star.name}
                            {star.mutagen && (
                              <span className={`text-[9px] ml-0.5 font-bold ${
                                star.mutagen === '化禄' ? 'text-green-600' :
                                star.mutagen === '化权' ? 'text-blue-600' :
                                star.mutagen === '化科' ? 'text-purple-600' : 'text-red-600'
                              }`}>[{star.mutagen.replace('化', '')}]</span>
                            )}
                            {star.brightness && !star.mutagen && (
                              <span className="text-[9px] text-gray-400 ml-0.5">{star.brightness}</span>
                            )}
                          </div>
                        ))}
                        {/* 辅星 */}
                        {palace.minorStars.map((star, si) => (
                          <div key={`m${si}`} className="text-[10px] text-gray-500 leading-tight">
                            {star.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 选中宫位详情 */}
            {selectedPalace && (
              <div className="card border-l-4 border-l-red-500 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title !mb-0">{selectedPalace.name}详解</h2>
                  <button
                    onClick={() => setSelectedPalaceIdx(null)}
                    className="text-xs text-gray-400 hover:text-red-700"
                  >
                    关闭 ✕
                  </button>
                </div>
                {PALACE_MEANING[selectedPalace.name] && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                      {PALACE_MEANING[selectedPalace.name].area}
                    </span>
                    <span className="text-xs text-gray-500">{PALACE_MEANING[selectedPalace.name].description}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 主星 */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full" /> 主星（{selectedPalace.majorStars.length}颗）
                    </h4>
                    {selectedPalace.majorStars.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPalace.majorStars.map((s, i) => {
                          const starInfo = MAIN_STAR_INTERPRETATION[Object.keys(MAIN_STAR_INTERPRETATION).find(k => s.name.includes(k)) || ''];
                          return (
                            <div key={i} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-bold text-sm ${getStarColorClass(s.name)}`}>{s.name}</span>
                                <span className="text-xs text-gray-400">{getStarLevel(s.name)}</span>
                                {s.brightness && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">{s.brightness}</span>}
                                {s.mutagen && (
                                  <span className={`text-xs px-1 rounded ${
                                    s.mutagen === '化禄' ? 'bg-green-100 text-green-700' :
                                    s.mutagen === '化权' ? 'bg-blue-100 text-blue-700' :
                                    s.mutagen === '化科' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                                  }`}>{s.mutagen}</span>
                                )}
                              </div>
                              {starInfo && <p className="text-xs text-gray-600 leading-relaxed">{starInfo.personality}</p>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">无主星坐守，借对宫星曜参断</p>
                    )}
                  </div>

                  {/* 辅星 */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full" /> 辅星（{selectedPalace.minorStars.length}颗）
                    </h4>
                    {selectedPalace.minorStars.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPalace.minorStars.map((s, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded border ${getStarColorClass(s.name)} bg-white`}>
                            {s.name}
                            {s.mutagen && <span className="text-[10px] ml-0.5">({s.mutagen.replace('化', '')})</span>}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">无辅星</p>
                    )}

                    {/* 三方四正 */}
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-xs font-bold text-yellow-800 mb-1">三方四正</h4>
                      <div className="text-xs text-yellow-700">
                        {sanfangPalaces.map(idx => {
                          const p = result?.palaces.find(pa => pa.index === idx);
                          return p ? `${p.name}宫` : '';
                        }).filter(Boolean).join(' · ') || '无'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 年龄大限 */}
                {ageLimits[selectedPalace.index] && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-xs font-bold text-blue-800 mb-1">年龄大限</h4>
                    <span className="text-sm font-bold text-blue-700">
                      {ageLimits[selectedPalace.index][0]} — {ageLimits[selectedPalace.index][1]} 岁
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 命理解析 */}
            {showInterpretation && interpretation && (
              <div className="space-y-6">
                {/* 综合总结 */}
                <div className="card bg-gradient-to-br from-red-50 via-white to-yellow-50 border border-red-200">
                  <h2 className="card-title chinese-red">命盘综合解析</h2>
                  <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {interpretation.summary}
                  </div>
                </div>

                {/* 命宫主星详解 */}
                {interpretation.mingGongStars.length > 0 && (
                  <div className="card">
                    <h2 className="card-title">命宫主星详解</h2>
                    <div className="space-y-4">
                      {interpretation.mingGongStars.map((star: any, i: number) => (
                        <div key={i} className="p-4 bg-parchment-50 rounded-lg border border-parchment-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl font-bold chinese-red">{star.name}</span>
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs">{star.nature}</span>
                            {star.brightness && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{star.brightness}</span>}
                            {star.mutagen && <span className="seal-tag">{star.mutagen}</span>}
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">{star.personality}</p>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { icon: '💼', title: '事业', content: star.career, color: 'bg-blue-50 border-blue-200' },
                              { icon: '💰', title: '财运', content: star.wealth, color: 'bg-yellow-50 border-yellow-200' },
                              { icon: '❤️', title: '感情', content: star.emotion, color: 'bg-pink-50 border-pink-200' },
                              { icon: '🏥', title: '健康', content: star.health, color: 'bg-green-50 border-green-200' },
                            ].map((item) => (
                              <div key={item.title} className={`p-3 rounded-lg border ${item.color}`}>
                                <div className="flex items-center gap-1 mb-1">
                                  <span>{item.icon}</span>
                                  <span className="font-bold text-xs text-gray-700">{item.title}</span>
                                </div>
                                <p className="text-xs text-gray-600">{item.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 重要宫位分析 */}
                <div className="card">
                  <h2 className="card-title">重要宫位分析</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: '财帛', icon: '💰', color: 'border-yellow-300 bg-yellow-50' },
                      { key: '官禄', icon: '💼', color: 'border-blue-300 bg-blue-50' },
                      { key: '夫妻', icon: '❤️', color: 'border-pink-300 bg-pink-50' },
                      { key: '福德', icon: '🙏', color: 'border-purple-300 bg-purple-50' },
                    ].map((item) => {
                      const palace = result.palaces.find(p => p.name.includes(item.key));
                      if (!palace) return null;
                      return (
                        <div key={item.key} className={`p-4 rounded-lg border ${item.color}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{item.icon}</span>
                            <h3 className="font-bold text-gray-800 text-sm">{palace.name}宫</h3>
                          </div>
                          <div className="space-y-1">
                            {palace.majorStars.length > 0 ? (
                              palace.majorStars.map((s, si) => (
                                <div key={si} className={`text-xs font-medium ${getStarColorClass(s.name)}`}>
                                  {s.name}
                                  {s.brightness && <span className="text-gray-400">({s.brightness})</span>}
                                  {s.mutagen && <span className="text-red-500 text-[10px] ml-1">[{s.mutagen.replace('化', '')}]</span>}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-gray-400 italic">无主星，借宫参断</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
