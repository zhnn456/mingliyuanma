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

// 四化颜色映射常量（已定义在后面，这里只是占位）
const COLOR_LEGEND = {
  '禄': 'text-green-700 bg-green-100',
  '权': 'text-blue-700 bg-blue-100',
  '科': 'text-purple-700 bg-purple-100',
  '忌': 'text-red-700 bg-red-100',
};

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

// 四化颜色映射
const MUTAGEN_STYLE: Record<string, string> = {
  '化禄': 'bg-green-100 text-green-800 border-green-300',
  '化权': 'bg-blue-100 text-blue-800 border-blue-300',
  '化科': 'bg-purple-100 text-purple-800 border-purple-300',
  '化忌': 'bg-red-100 text-red-800 border-red-300',
};

// 亮度颜色映射
const BRIGHTNESS_STYLE: Record<string, string> = {
  '庙': 'text-red-600 font-bold',
  '旺': 'text-gold-600 font-bold',
  '得': 'text-blue-600',
  '利': 'text-blue-500',
  '平': 'text-gray-500',
  '不': 'text-gray-400',
  '陷': 'text-gray-400',
};

// 亮度背景映射
const BRIGHTNESS_BG: Record<string, string> = {
  '庙': 'bg-red-50',
  '旺': 'bg-gold-50',
  '得': 'bg-blue-50',
  '利': 'bg-blue-50',
  '平': 'bg-gray-50',
  '不': 'bg-gray-100',
  '陷': 'bg-gray-100',
};

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

  // 使用API返回的decadal数据
  const ageLimits = useMemo(() => {
    if (!result) return [];
    return result.palaces.map(p => p.decadal?.range || null);
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
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Noto Serif SC, STSong, SimSun, serif' }}>十二宫命盘</h2>
                <p className="text-xs text-red-200 mt-0.5">点击宫位查看详情 · 红色高亮为三方四正</p>
              </div>
              <div className="grid grid-cols-4 gap-0" style={{ gridTemplateRows: 'repeat(4, minmax(0, 1fr))' }}>
                {/* 中宫信息区 — 显式定位在中间2x2区域 */}
                <div className="bg-gradient-to-br from-red-800 to-red-900 text-white flex items-center justify-center p-3 min-h-[150px] border border-red-700"
                  style={{ gridRow: '2 / 4', gridColumn: '2 / 4' }}>
                  <div className="text-center">
                    <div className="font-bold text-lg" style={{ fontFamily: 'Noto Serif SC, STSong, SimSun, serif' }}>紫微斗数</div>
                    <div className="text-xs mt-1 opacity-80 font-mono">{result.basic.chineseDate}</div>
                    <div className="divider-gold !my-2 !bg-white/20 !h-px" />
                    <div className="text-xs opacity-90">{result.basic.fiveElementsClass}</div>
                    <div className="text-xs mt-1 flex items-center justify-center gap-3">
                      <span>命主 <strong className="text-gold-300">{result.basic.soul || '--'}</strong></span>
                      <span>身主 <strong className="text-blue-300">{result.basic.body || '--'}</strong></span>
                    </div>
                    <div className="text-xs mt-1 opacity-60">{result.basic.gender === '男' ? '乾造' : '坤造'} · {result.basic.zodiac}年</div>
                    <div className="w-7 h-7 mx-auto mt-2 border border-white/30 rounded-full flex items-center justify-center text-[10px] opacity-50">☯</div>
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
                  const decadalRange = palace.decadal?.range;
                  const isLife = palace.name === '命宫';

                  // CSS Grid 显式定位（1-based）
                  const gridRow = pos.row + 1;
                  const gridCol = pos.col + 1;

                  return (
                    <div
                      key={branchIdx}
                      onClick={() => setSelectedPalaceIdx(isSelected ? null : branchIdx)}
                      style={{ gridRow, gridColumn: gridCol }}
                      className={`p-1.5 min-h-[140px] border cursor-pointer transition-all duration-200 flex flex-col ${
                        isSelected
                          ? 'bg-red-100 border-red-500 ring-2 ring-red-400 z-10'
                          : isSanfang
                          ? 'bg-yellow-50 border-yellow-400'
                          : isLife
                          ? 'bg-gold-50/50 border-gold-300'
                          : palace.isBody
                          ? 'bg-blue-50/60 border-parchment-200'
                          : 'bg-white border-parchment-200 hover:bg-parchment-50'
                      }`}
                    >
                      {/* 宫位头: 宫干支 + 宫名 + 大限 */}
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-gray-400 font-mono">
                            {palace.heavenlyStem}{palace.earthlyBranch}
                          </span>
                          <span className={`font-bold text-xs ${isLife ? 'text-gold-700' : 'text-red-700'}`}>
                            {palace.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {palace.isBody && <span className="text-[9px] text-blue-600 bg-blue-100 px-1 rounded font-medium">身</span>}
                          {decadalRange && (
                            <span className="text-[8px] text-gray-400 bg-gray-100 px-1 rounded font-mono">
                              {decadalRange[0]}-{decadalRange[1]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 主星 - 带亮度 + 四化 */}
                      <div className="flex flex-wrap gap-0.5 mb-0.5">
                        {palace.majorStars.map((star, si) => (
                          <span
                            key={si}
                            className={`inline-flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded ${
                              star.mutagen
                                ? MUTAGEN_STYLE[star.mutagen] || 'bg-gray-100 text-gray-700'
                                : star.brightness && ['庙', '旺', '得'].includes(star.brightness)
                                ? 'bg-red-50 text-red-700'
                                : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            {star.name}
                            {star.brightness && (
                              <span className={`text-[8px] ${BRIGHTNESS_STYLE[star.brightness] || 'text-gray-400'}`}>
                                {star.brightness}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* 辅星 */}
                      {palace.minorStars.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mb-0.5">
                          {palace.minorStars.map((star, si) => (
                            <span key={si} className="text-[9px] text-gray-500 px-1 py-0.5 rounded bg-gray-50/50">
                              {star.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 杂曜 */}
                      {palace.adjectiveStars && palace.adjectiveStars.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 flex-1">
                          {palace.adjectiveStars.slice(0, 4).map((name, si) => (
                            <span key={si} className="text-[8px] text-gray-400 px-1 rounded bg-white/50">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 底部: 长生十二神 + 博士十二神 */}
                      {(palace.changsheng12 || palace.boshi12) && (
                        <div className="flex justify-between text-[7px] text-gray-400 mt-auto pt-0.5 border-t border-parchment-100">
                          {palace.changsheng12 ? <span>{palace.changsheng12}</span> : <span />}
                          {palace.boshi12 ? <span>{palace.boshi12}</span> : <span />}
                        </div>
                      )}
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
                {(() => {
                  const limit = ageLimits[selectedPalace.index];
                  return limit ? (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-xs font-bold text-blue-800 mb-1">年龄大限</h4>
                      <span className="text-sm font-bold text-blue-700">
                        {limit[0]} — {limit[1]} 岁
                      </span>
                    </div>
                  ) : null;
                })()}
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

                {/* 格局分析 */}
                {interpretation.patterns && interpretation.patterns.length > 0 && (
                  <div className="card border-l-4 border-l-purple-500">
                    <h2 className="card-title">命盘格局</h2>
                    <div className="space-y-2">
                      {interpretation.patterns.map((p: string, i: number) => (
                        <div key={i} className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-sm text-purple-800">
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                          <p className="text-sm text-gray-700 mb-2 leading-relaxed">{star.personality}</p>
                          {/* 古籍引用 */}
                          {star.classicQuote && (
                            <div className="p-2 bg-red-50 rounded border border-red-200 mb-3 text-xs text-red-700 italic">
                              {star.classicQuote}
                            </div>
                          )}
                          {/* 星曜在命宫的具体含义 */}
                          {star.inPalaceMeaning && (
                            <div className="p-2 bg-yellow-50 rounded border border-yellow-200 mb-3 text-xs text-yellow-800">
                              {star.inPalaceMeaning}
                            </div>
                          )}
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

                {/* 四化飞星 */}
                {interpretation.fourTransformations && interpretation.fourTransformations.length > 0 && (
                  <div className="card">
                    <h2 className="card-title">四化飞星</h2>
                    <div className="flex flex-wrap gap-2">
                      {interpretation.fourTransformations.map((m: any, i: number) => (
                        <div key={i} className={`p-3 rounded-lg border text-sm ${
                          m.mutagen === '化禄' ? 'bg-green-50 border-green-200 text-green-800' :
                          m.mutagen === '化权' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                          m.mutagen === '化科' ? 'bg-purple-50 border-purple-200 text-purple-800' :
                          'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          <span className="font-bold">{m.palace}宫</span> · {m.star}{m.mutagen}
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
                      { key: '迁移', icon: '🚀', color: 'border-green-300 bg-green-50' },
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
                                  {s.mutagen && <span className={`text-[10px] ml-1 ${
                                    s.mutagen === '化禄' ? 'text-green-600' :
                                    s.mutagen === '化权' ? 'text-blue-600' :
                                    s.mutagen === '化科' ? 'text-purple-600' : 'text-red-600'
                                  }`}>[{s.mutagen.replace('化', '')}]</span>}
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
