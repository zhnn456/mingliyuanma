'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-client';
import { generateZiweiInterpretation, PALACE_MEANING, MAIN_STAR_INTERPRETATION } from '@/lib/interpretation/ziwei';
import { PaipanForm } from '@/components/PaipanForm';
import { InterpretPaywall } from '@/components/InterpretPaywall';
import { useToast } from '@/components/Toast';
import ZiweiChart, { ViewMode, TimeMode } from '@/components/ZiweiChart';

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
  detailedAnalysis?: {
    palaceDetails: Array<{
      palaceName: string;
      area: string;
      description: string;
      mainStarAnalysis: string;
      minorStarAnalysis: string;
      shaStarAnalysis: string;
      sihuaAnalysis: string;
      sanfangAnalysis: string;
      brightnessAnalysis: string;
      overall: string;
    }>;
    patterns: Array<{
      name: string;
      condition: string;
      successCondition: string;
      failureCondition: string;
      influence: string;
      classicSource: string;
      advice: string;
    }>;
    decadalAnalysis: Array<{
      range: string;
      palaceName: string;
      stars: string;
      fortune: string;
      caution: string;
    }>;
    mingShenAnalysis: { analysis: string; advice: string };
    sihuaOverview: Array<{
      palace: string;
      star: string;
      mutagen: string;
      meaning: string;
      advice: string;
    }>;
    overallSummary: string;
  };
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
  const { user: session } = useAuth();
  const { addToast } = useToast();
  const [chartData, setChartData] = useState<ZiweiResult | null>(null);
  const [interpretData, setInterpretData] = useState<ZiweiResult | null>(null);
  const [paywall, setPaywall] = useState<{ status: 401 | 402; cost?: number; balance?: number } | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [loadingInterpret, setLoadingInterpret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPalaceIdx, setSelectedPalaceIdx] = useState<number | null>(null);
  const [showInterpretation, setShowInterpretation] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('sanhe');
  const [timeMode, setTimeMode] = useState<TimeMode>('base');

  const displayResult = interpretData || chartData;

  const fetchBalance = async (): Promise<number> => {
    try {
      const r = await fetch('/api/user/lingzhu');
      if (r.ok) {
        const j = await r.json();
        return j.balance || 0;
      }
    } catch {}
    return 0;
  };

  useEffect(() => {
    if (session && !initialLoaded) {
      setInitialLoaded(true);
      fetch('/api/user/latest?type=ziwei')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.record?.result) {
            setChartData(data.record.result);
            if (data.record.interpretData?.detailedAnalysis) {
              setInterpretData(data.record.result);
            }
          }
        })
        .catch(() => {});
    }
  }, [session, initialLoaded]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      if (data.hour === null) {
        throw new Error('紫微斗数排盘需要出生时辰，暂不支持未知时辰。请在表单中选择具体时辰。');
      }
      const reqBody = { year: data.year, month: data.month, day: data.day, hour: data.hour, gender: data.gender, isLunar: data.isLunar };
      const response = await fetch('/api/ziwei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reqBody, mode: 'chart' }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || '排盘失败');
      setChartData(json.result);
      setInterpretData(null);
      setPaywall(null);
      setFormData(reqBody);
      setSelectedPalaceIdx(null);
      setShowInterpretation(false);
      addToast('success', '紫微斗数排盘完成！');
    } catch (err: any) {
      const msg = err.message || '排盘失败';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInterpret = async (useLingzhu: boolean) => {
    if (!formData) return;
    setLoadingInterpret(true);
    try {
      const response = await fetch('/api/ziwei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode: 'full', useLingzhu }),
      });
      const json = await response.json();
      if (response.status === 401) {
        setPaywall({ status: 401 });
      } else if (response.status === 402) {
        if (useLingzhu) {
          setPaywall(null);
          addToast('error', json.error || '灵珠不足，请充值');
        } else {
          const balance = await fetchBalance();
          setPaywall({ status: 402, cost: json.cost || 50, balance });
          if (json.result) setChartData(json.result);
        }
      } else if (!response.ok) {
        throw new Error(json.error || '解读失败');
      } else {
        setInterpretData(json.result);
        setPaywall(null);
        setShowInterpretation(true);
        addToast('success', '解读完成');
      }
    } catch (err: any) {
      setPaywall(null);
      const msg = err.message || '解读失败';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoadingInterpret(false);
    }
  };

  // 使用API返回的decadal数据
  const ageLimits = useMemo(() => {
    if (!displayResult) return [];
    return displayResult.palaces.map(p => p.decadal?.range || null);
  }, [displayResult]);

  // 三方四正
  const sanfangPalaces = useMemo(() => {
    if (selectedPalaceIdx === null || !displayResult) return [];
    return SANFANG[selectedPalaceIdx] || [];
  }, [selectedPalaceIdx, displayResult]);

  // 星曜组合
  const combinations = useMemo(() => {
    if (!displayResult) return [];
    return detectCombinations(displayResult.palaces);
  }, [displayResult]);

  const interpretation = displayResult ? generateZiweiInterpretation(displayResult.palaces, displayResult.basic) : null;

  const selectedPalace = selectedPalaceIdx !== null ? displayResult?.palaces.find(p => p.index === selectedPalaceIdx) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-10">
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 页面标题 */}
        <div className="page-header">
          <div className="section-label justify-center">ZI WEI DOU SHU</div>
          <h1 className="page-header-title">
            <span>紫微斗数排盘</span>
          </h1>
          <p className="page-header-subtitle">位列&ldquo;五大神数&rdquo;之首，以十二宫星曜分布，推演人生命运轨迹</p>
        </div>

        {/* 输入表单 */}
        <div className="form-card mb-8">
          <PaipanForm onSubmit={handleSubmit} loading={loading} submitText="开始排盘" />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {(chartData || interpretData) && displayResult && (
          <div className="space-y-6 animate-fade-in">
            {/* 功能切换 */}
            <div className="tab-nav">
              <button
                onClick={() => setShowInterpretation(true)}
                className={`tab-btn ${showInterpretation ? 'active' : ''}`}
              >
                详细解析
              </button>
              <button
                onClick={() => setShowInterpretation(false)}
                className={`tab-btn ${!showInterpretation ? 'active' : ''}`}
              >
                纯命盘
              </button>
            </div>

            {/* 命盘基本信息 - 古卷风格 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '农历', value: displayResult.basic.lunarDate, color: '' },
                { label: '四柱八字', value: displayResult.basic.chineseDate, color: '' },
                { label: '五行局', value: displayResult.basic.fiveElementsClass, color: 'text-[#9B2C2C]' },
                { label: '生肖', value: displayResult.basic.zodiac, color: '' },
                { label: '命主', value: displayResult.basic.soul || '--', color: 'text-amber-700' },
                { label: '身主', value: displayResult.basic.body || '--', color: 'text-indigo-700' },
                { label: '命宫', value: displayResult.basic.earthlyBranchOfSoulPalace || '--', color: 'text-yellow-700' },
                { label: '身宫', value: displayResult.basic.earthlyBranchOfBodyPalace || '--', color: 'text-emerald-700' },
              ].map((item) => (
                <div key={item.label} className="card !p-3 text-center bg-gradient-to-br from-[#FDF6E3] to-[#F5E6C8] border-amber-200/60">
                  <div className="text-xs text-amber-800/70 mb-1 tracking-wider">{item.label}</div>
                  <div className={`font-bold ${item.color || 'text-slate-900'}`}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* 星曜组合提示 */}
            {combinations.length > 0 && (
              <div className="relative card !p-4 border-l-4 border-l-[#9B2C2C] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-50/50 to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="text-sm font-bold text-[#7B1F1F] mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#9B2C2C] text-white rounded flex items-center justify-center text-[10px]">★</span>
                    命盘格局
                  </div>
                  <div className="space-y-1">
                    {combinations.map((c, i) => (
                      <div key={i} className="text-sm text-slate-700">{c}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 三视图切换 + 时间轴导航 - 朱砂红+金箔设计 */}
            <div className="relative rounded-xl overflow-hidden shadow-xl border border-amber-800/30">
              {/* 背景层 */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#7B1F1F] via-[#9B2C2C] to-[#7B1F1F]" />
              {/* 金色装饰线 */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A962] to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A962]/70 to-transparent" />
              {/* 暗纹 */}
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0v40M0 20h40' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
              }} />

              <div className="relative flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-white">
                {/* 视图切换 */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#C9A962] mr-2 tracking-widest">视图</span>
                  {([
                    { key: 'feixing', label: '飞星盘', desc: '飞化路径' },
                    { key: 'sanhe', label: '三合盘', desc: '三方四正' },
                    { key: 'sihua', label: '四化盘', desc: '禄权科忌' },
                  ] as const).map((v) => (
                    <button
                      key={v.key}
                      onClick={() => setViewMode(v.key)}
                      className={`relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                        viewMode === v.key
                          ? 'bg-[#C9A962] text-[#7B1F1F] shadow-lg shadow-amber-900/30'
                          : 'bg-[#5C1515]/50 hover:bg-[#6B1A1A] text-red-100 border border-[#C9A962]/20'
                      }`}
                    >
                      {v.label}
                      <span className="text-[10px] ml-1 opacity-60">{v.desc}</span>
                      {viewMode === v.key && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FFD700]" />
                      )}
                    </button>
                  ))}
                </div>

                {/* 时间轴 */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#C9A962] mr-2 tracking-widest">时间</span>
                  {([
                    { key: 'base', label: '本命' },
                    { key: 'decadal', label: '大限' },
                    { key: 'annual', label: '流年' },
                    { key: 'monthly', label: '流月' },
                  ] as const).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTimeMode(t.key)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                        timeMode === t.key
                          ? 'bg-[#C9A962]/90 text-[#7B1F1F] font-bold shadow'
                          : 'text-red-200 hover:bg-[#C9A962]/20 hover:text-[#FFD700]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 十二宫命盘 - 使用新组件 */}
            <ZiweiChart
              data={displayResult}
              viewMode={viewMode}
              timeMode={timeMode}
              selectedPalaceIdx={selectedPalaceIdx}
              onSelectPalace={setSelectedPalaceIdx}
            />

            {/* 选中宫位详情 - 宣纸古卷设计 */}
            {selectedPalace && (
              <div className="relative card !p-0 overflow-hidden animate-fade-in rounded-xl border border-amber-800/30 shadow-xl">
                {/* 顶部朱砂红条 */}
                <div className="bg-gradient-to-r from-[#7B1F1F] via-[#9B2C2C] to-[#7B1F1F] px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* 朱砂印章 */}
                    <div className="w-8 h-8 bg-[#B22222] border border-[#C9A962] rounded flex items-center justify-center">
                      <span className="text-[9px] text-[#FFD700]">{selectedPalace.name.slice(0, 2)}</span>
                    </div>
                    <h2 className="text-white font-bold text-lg tracking-wide" style={{ fontFamily: '"Noto Serif SC", serif' }}>
                      {selectedPalace.name}详解
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedPalaceIdx(null)}
                    className="text-red-200 hover:text-white text-sm transition-colors"
                  >
                    关闭 ✕
                  </button>
                </div>
                {/* 金色装饰线 */}
                <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A962] to-transparent" />

                <div className="p-5 bg-gradient-to-br from-[#FDF6E3] via-[#F5E6C8] to-[#F5E6C8]">
                  {PALACE_MEANING[selectedPalace.name] && (
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-200/60">
                      <span className="text-xs px-2.5 py-1 bg-[#9B2C2C] text-[#FFD700] rounded font-medium">
                        {PALACE_MEANING[selectedPalace.name].area}
                      </span>
                      <span className="text-xs text-amber-800/80">{PALACE_MEANING[selectedPalace.name].description}</span>
                    </div>
                  )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 主星 */}
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#9B2C2C] rounded-full" /> 主星 · {selectedPalace.majorStars.length}颗
                    </h4>
                    {selectedPalace.majorStars.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPalace.majorStars.map((s, i) => {
                          const starInfo = MAIN_STAR_INTERPRETATION[Object.keys(MAIN_STAR_INTERPRETATION).find(k => s.name.includes(k)) || ''];
                          return (
                            <div key={i} className="p-2.5 bg-white/70 rounded-lg border border-amber-200/60 shadow-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-bold text-sm ${getStarColorClass(s.name)}`}>{s.name}</span>
                                <span className="text-xs text-amber-700/60">{getStarLevel(s.name)}</span>
                                {s.brightness && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 rounded border border-blue-200">{s.brightness}</span>}
                                {s.mutagen && (
                                  <span className={`text-xs px-1.5 rounded font-medium ${
                                    s.mutagen === '化禄' ? 'bg-emerald-100 text-emerald-700' :
                                    s.mutagen === '化权' ? 'bg-blue-100 text-blue-700' :
                                    s.mutagen === '化科' ? 'bg-violet-100 text-violet-700' : 'bg-red-100 text-red-700'
                                  }`}>{s.mutagen}</span>
                                )}
                              </div>
                              {starInfo && <p className="text-xs text-slate-600 leading-relaxed">{starInfo.personality}</p>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-amber-700/50 italic py-4">无主星坐守，借对宫星曜参断</p>
                    )}
                  </div>

                  {/* 辅星 */}
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-700 rounded-full" /> 辅星 · {selectedPalace.minorStars.length}颗
                    </h4>
                    {selectedPalace.minorStars.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPalace.minorStars.map((s, i) => (
                          <span key={i} className={`text-xs px-2.5 py-1 rounded border bg-white/70 ${getStarColorClass(s.name)}`}>
                            {s.name}
                            {s.mutagen && <span className="text-[10px] ml-0.5">({s.mutagen.replace('化', '')})</span>}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-amber-700/50 italic py-4">无辅星</p>
                    )}

                    {/* 三方四正 */}
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-xs font-bold text-yellow-800 mb-1">三方四正</h4>
                      <div className="text-xs text-yellow-700">
                        {sanfangPalaces.map(idx => {
                          const p = displayResult?.palaces.find(pa => pa.index === idx);
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
                      const palace = displayResult.palaces.find(p => p.name.includes(item.key));
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

                {/* ===== 深度解读 ===== */}
                {interpretData?.detailedAnalysis && (
                  <>
                    {/* 综合总评 */}
                    {interpretData?.detailedAnalysis.overallSummary && (
                      <div className="card bg-gradient-to-br from-red-50 via-white to-yellow-50 border border-red-200">
                        <h2 className="card-title chinese-red">命盘深度总评</h2>
                        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {interpretData?.detailedAnalysis.overallSummary}
                        </div>
                      </div>
                    )}

                    {/* 格局深度分析 */}
                    {interpretData?.detailedAnalysis.patterns.length > 0 && (
                      <div className="card border-l-4 border-l-purple-500">
                        <h2 className="card-title">格局深度分析</h2>
                        <div className="space-y-4">
                          {interpretData?.detailedAnalysis.patterns.map((p, i) => (
                            <div key={i} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg font-bold text-purple-800">{p.name}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-xs font-bold text-gray-500">成立条件</span>
                                  <p className="text-gray-700 mt-0.5">{p.condition}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-green-600">成格条件</span>
                                  <p className="text-gray-700 mt-0.5">{p.successCondition}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-red-600">破格条件</span>
                                  <p className="text-gray-700 mt-0.5">{p.failureCondition}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-blue-600">影响范围</span>
                                  <p className="text-gray-700 mt-0.5">{p.influence}</p>
                                </div>
                              </div>
                              <div className="mt-3 p-2 bg-white/60 rounded border border-purple-100">
                                <p className="text-xs text-purple-700 italic mb-1">{p.classicSource}</p>
                                <p className="text-xs text-gray-600">建议：{p.advice}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 四化飞星总论 */}
                    {interpretData?.detailedAnalysis.sihuaOverview.length > 0 && (
                      <div className="card">
                        <h2 className="card-title">四化飞星总论</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {interpretData?.detailedAnalysis.sihuaOverview.map((s, i) => (
                            <div key={i} className={`p-3 rounded-lg border ${
                              s.mutagen === '化禄' ? 'bg-green-50 border-green-200' :
                              s.mutagen === '化权' ? 'bg-blue-50 border-blue-200' :
                              s.mutagen === '化科' ? 'bg-purple-50 border-purple-200' :
                              'bg-red-50 border-red-200'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-bold text-sm ${
                                  s.mutagen === '化禄' ? 'text-green-700' :
                                  s.mutagen === '化权' ? 'text-blue-700' :
                                  s.mutagen === '化科' ? 'text-purple-700' : 'text-red-700'
                                }`}>{s.star}{s.mutagen}</span>
                                <span className="text-xs text-gray-500">入{s.palace}</span>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed">{s.meaning}</p>
                              {s.advice && <p className="text-xs text-gray-500 mt-1">建议：{s.advice}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 命身宫关系 */}
                    {interpretData?.detailedAnalysis.mingShenAnalysis.analysis && (
                      <div className="card border-l-4 border-l-gold-500">
                        <h2 className="card-title">命身宫关系</h2>
                        <p className="text-sm text-gray-700 leading-relaxed mb-2">
                          {interpretData?.detailedAnalysis.mingShenAnalysis.analysis}
                        </p>
                        <p className="text-xs text-gray-500">建议：{interpretData?.detailedAnalysis.mingShenAnalysis.advice}</p>
                      </div>
                    )}

                    {/* 大限运势分析 */}
                    {interpretData?.detailedAnalysis.decadalAnalysis.length > 0 && (
                      <div className="card">
                        <h2 className="card-title">大限运势详析</h2>
                        <p className="text-xs text-gray-500 mb-4">每步大限十年，以下为各步大限的运势分析</p>
                        <div className="space-y-3">
                          {interpretData?.detailedAnalysis.decadalAnalysis.map((d, i) => (
                            <div key={i} className="p-3 bg-parchment-50 rounded-lg border border-parchment-200">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-bold text-red-700 bg-red-100 px-2 py-1 rounded">
                                  {d.range}
                                </span>
                                <span className="text-sm text-gray-600">{d.palaceName} · {d.stars}</span>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed mb-1">{d.fortune}</p>
                              {d.caution && (
                                <p className="text-xs text-orange-600">注意事项：{d.caution}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 十二宫逐一详析 */}
                    <div className="card">
                      <h2 className="card-title">十二宫逐一详析</h2>
                      <div className="space-y-4">
                        {interpretData?.detailedAnalysis.palaceDetails.map((pd, i) => (
                          <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="font-bold text-gray-800">{pd.palaceName}</span>
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">{pd.area}</span>
                              <span className="text-xs text-gray-500">{pd.description}</span>
                            </div>

                            {/* 总体评价 */}
                            <div className="p-2 bg-white rounded border border-gray-100 mb-2">
                              <span className="text-xs font-bold text-gray-600">总体评价：</span>
                              <span className="text-xs text-gray-700">{pd.overall}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {/* 主星分析 */}
                              {pd.mainStarAnalysis && (
                                <div className="p-2 bg-red-50/50 rounded">
                                  <span className="font-bold text-red-700">主星分析</span>
                                  <p className="text-gray-700 mt-1 whitespace-pre-line">{pd.mainStarAnalysis}</p>
                                </div>
                              )}

                              {/* 四化分析 */}
                              {pd.sihuaAnalysis && (
                                <div className="p-2 bg-purple-50/50 rounded">
                                  <span className="font-bold text-purple-700">四化影响</span>
                                  <p className="text-gray-700 mt-1 whitespace-pre-line">{pd.sihuaAnalysis}</p>
                                </div>
                              )}

                              {/* 辅星分析 */}
                              {pd.minorStarAnalysis && (
                                <div className="p-2 bg-blue-50/50 rounded">
                                  <span className="font-bold text-blue-700">辅星</span>
                                  <p className="text-gray-700 mt-1 whitespace-pre-line">{pd.minorStarAnalysis}</p>
                                </div>
                              )}

                              {/* 煞星分析 */}
                              {pd.shaStarAnalysis && (
                                <div className="p-2 bg-orange-50/50 rounded">
                                  <span className="font-bold text-orange-700">煞星影响</span>
                                  <p className="text-gray-700 mt-1 whitespace-pre-line">{pd.shaStarAnalysis}</p>
                                </div>
                              )}

                              {/* 三方四正 */}
                              <div className="p-2 bg-yellow-50/50 rounded md:col-span-2">
                                <span className="font-bold text-yellow-700">三方四正</span>
                                <p className="text-gray-700 mt-1 whitespace-pre-line">{pd.sanfangAnalysis}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 查看详细解读按钮 */}
            {!interpretData && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-red-600 to-amber-500 p-[2px] shadow-xl">
                <div className="bg-white rounded-2xl px-6 py-5 text-center">
                  <div className="text-3xl mb-2">📖</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">查看紫微斗数详细解读</h3>
                  <p className="text-sm text-gray-500 mb-4">解锁命盘综合解析、格局深度分析、四化飞星总论等深度内容</p>
                  <button
                    onClick={() => handleInterpret(false)}
                    disabled={loadingInterpret}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
                  >
                    {loadingInterpret ? '加载中...' : '查看详细解读'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {paywall && (
          <InterpretPaywall
            status={paywall.status}
            cost={paywall.cost}
            balance={paywall.balance}
            moduleLabel="紫微斗数"
            onConfirmPay={() => handleInterpret(true)}
            onClose={() => setPaywall(null)}
          />
        )}
      </div>
    </div>
  );
}
