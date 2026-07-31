'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-client';
import { BAMEN_INTERPRETATION, JIUXING_INTERPRETATION, BASHEN_INTERPRETATION, TEN_STEM_PATTERNS, QIMEN_YONGSHEN } from '@/lib/interpretation/qimen';
import { QUESTION_TYPES, generateQimenDetailedAnalysis } from '@/lib/interpretation/qimen-detailed';
import { useToast } from '@/components/Toast';
import QimenChart from '@/components/QimenChart';

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
  auspiciousPatterns: Array<{ name: string }>;
  inauspiciousPatterns: Array<{ name: string }>;
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
  specialPatterns: {
    fuYinFanYin?: { description: string[] };
    wuBuYuShi?: { isWuBuYuShi: boolean; description?: string };
    auspiciousPatterns?: Array<{ name: string }>;
    inauspiciousPatterns?: Array<{ name: string }>;
  };
}

// 八卦方位
const TRIGRAM_DIRECTION: Record<string, string> = {
  '坎': '北', '坤': '西南', '震': '东', '巽': '东南',
  '乾': '西北', '兑': '西', '艮': '东北', '离': '南',
};

// 八神颜色
const DEITY_COLORS: Record<string, string> = {
  '值符': '#d97706', '腾蛇': '#7c3aed', '太阴': '#6366f1',
  '六合': '#059669', '白虎': '#dc2626', '玄武': '#1e3a5f',
  '九地': '#6b7280', '九天': '#0891b2',
};

function getGateLevel(gate: string): string {
  const levelColors: Record<string, string> = {
    '开门': 'bg-green-100 text-green-800',
    '休门': 'bg-blue-100 text-blue-800',
    '生门': 'bg-green-100 text-green-800',
    '伤门': 'bg-red-100 text-red-800',
    '杜门': 'bg-gray-100 text-gray-800',
    '景门': 'bg-yellow-100 text-yellow-800',
    '死门': 'bg-gray-800 text-white',
    '惊门': 'bg-orange-100 text-orange-800',
  };
  return levelColors[gate] || 'bg-gray-100 text-gray-800';
}

// 起卦因素说明 - 完整展示奇门起卦所需因素
const QIMEN_FACTORS = [
  { name: '真太阳时', desc: '校正经度差与时辰', icon: '☀️' },
  { name: '节气判定', desc: '冬至/夏至分界', icon: '🌱' },
  { name: '阴阳遁', desc: '冬至后阳遁', icon: '☯️' },
  { name: '三元归属', desc: '上/中/下元', icon: '📐' },
  { name: '局数计算', desc: '1-9局确定', icon: '🔢' },
  { name: '旬首甲己', desc: '符首定位', icon: '🏮' },
  { name: '值符值使', desc: '符使落宫', icon: '⭐' },
  { name: '空亡', desc: '旬中空亡地支', icon: '⚪' },
  { name: '拆补法', desc: '传统起局法', icon: '📜' },
  { name: '干支纪年', desc: '四柱八字', icon: '🎋' },
];

export default function QimenPage() {
  const { user: session } = useAuth();
  const { addToast } = useToast();
  const [result, setResult] = useState<QimenResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [questionType, setQuestionType] = useState('general');
  const [showFactors, setShowFactors] = useState(false);

  useEffect(() => {
    if (session && !initialLoaded) {
      setInitialLoaded(true);
      fetch('/api/user/latest?type=qimen')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.record?.result) setResult(data.record.result);
        })
        .catch(() => {});
    }
  }, [session, initialLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let year: number, month: number, day: number, hour: number, minute: number;
      if (useCurrentTime) {
        const now = new Date();
        year = now.getFullYear(); month = now.getMonth() + 1; day = now.getDate();
        hour = now.getHours(); minute = now.getMinutes();
      } else {
        const dt = new Date(`${date}T${time || '12:00'}`);
        year = dt.getFullYear(); month = dt.getMonth() + 1; day = dt.getDate();
        hour = dt.getHours(); minute = dt.getMinutes();
      }
      const response = await fetch('/api/qimen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, day, hour, minute }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || '排盘失败');
      setResult(json.result);
      setSelectedPosition(null);
      addToast('success', '奇门遁甲排盘完成！');
    } catch (err: any) {
      const msg = err.message || '排盘失败';
      setError(msg);
      addToast('error', msg);
    } finally { setLoading(false); }
  };

  const getPalaceByPosition = (pos: number) => result?.palaces.find(p => p.position === pos);
  const selectedPalace = selectedPosition ? getPalaceByPosition(selectedPosition) : null;

  // 分析吉利方位和不利方位
  const directionAnalysis = useMemo(() => {
    if (!result) return { auspicious: [] as string[], inauspicious: [] as string[] };
    const auspicious: string[] = [];
    const inauspicious: string[] = [];
    
    result.palaces.forEach(p => {
      if (p.position === 5) return;
      const gateInfo = BAMEN_INTERPRETATION[p.gate];
      const dir = TRIGRAM_DIRECTION[p.trigram] || '';
      if (gateInfo) {
        if (gateInfo.level.includes('大吉') || gateInfo.level === '吉') {
          auspicious.push(`${p.trigram}宫(${dir})·${p.gate}`);
        } else if (gateInfo.level.includes('大凶') || gateInfo.level === '凶') {
          inauspicious.push(`${p.trigram}宫(${dir})·${p.gate}`);
        }
      }
    });
    return { auspicious, inauspicious };
  }, [result]);

  // 深度解读（随问题类型变化）
  const detailedAnalysis = useMemo(() => {
    if (!result) return null;
    return generateQimenDetailedAnalysis(result, questionType);
  }, [result, questionType]);

  // 当前用神类型
  const currentQuestionType = QUESTION_TYPES.find(q => q.key === questionType);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fef9f0] via-[#fdf4e3] to-[#fef9f0] py-8">
      {/* 背景纹理 */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent to-red-600" />
            <span className="text-red-700 text-sm tracking-[0.3em] font-medium">QI MEN DUN JIA</span>
            <div className="w-16 h-[2px] bg-gradient-to-l from-transparent to-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-red-900 mb-2" style={{ fontFamily: 'Noto Serif SC, STSong, SimSun, serif' }}>
            奇门遁甲
          </h1>
          <p className="text-gray-600 text-sm">时家奇门排盘 · 观天时地利 · 断吉凶休咎</p>
        </div>

        {/* 输入表单 */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-amber-200/50 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-center">
              <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setUseCurrentTime(true)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    useCurrentTime
                      ? 'bg-red-700 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  当前时间起局
                </button>
                <button
                  type="button"
                  onClick={() => setUseCurrentTime(false)}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    !useCurrentTime
                      ? 'bg-red-700 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  指定时间起局
                </button>
              </div>
            </div>

            {!useCurrentTime && (
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">日期</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">时间</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-md mx-auto block py-3 px-6 bg-gradient-to-r from-red-800 to-red-900 text-white rounded-xl font-medium text-base shadow-lg hover:from-red-900 hover:to-red-950 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  排盘中...
                </span>
              ) : (
                '开始排盘'
              )}
            </button>
          </form>

          {/* 起卦因素说明 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowFactors(!showFactors)}
              className="w-full text-center flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-2"
            >
              <span className="text-red-600">📖</span>
              <span className="font-medium">起卦所需因素（点击查看详情）</span>
              <span className={`transition-transform ${showFactors ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {showFactors && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2.5">
                {QIMEN_FACTORS.map((f, i) => (
                  <div key={i} className="p-3 bg-gradient-to-br from-amber-50/90 to-yellow-50/90 rounded-xl border border-amber-200/60 text-center">
                    <div className="text-lg mb-1">{f.icon}</div>
                    <div className="text-xs font-bold text-red-700 mb-0.5">{f.name}</div>
                    <div className="text-[10px] text-gray-500">{f.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* 排盘详细信息 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-amber-200/50 p-5">
              <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-red-600 rounded" />
                排盘信息
              </h3>
              
              {/* 主要信息 - 更大更清晰 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gradient-to-br from-red-50 to-amber-50 rounded-xl p-3 text-center border border-red-200/50">
                  <div className="text-xs text-gray-500 mb-1">四柱</div>
                  <div className="text-sm font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                    {result.fourPillars.year.stem}{result.fourPillars.year.branch}
                    {result.fourPillars.month.stem}{result.fourPillars.month.branch}
                  </div>
                  <div className="text-sm font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                    {result.fourPillars.day.stem}{result.fourPillars.day.branch}
                    {result.fourPillars.hour.stem}{result.fourPillars.hour.branch}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 text-center border-2 border-amber-300/50">
                  <div className="text-xs text-amber-700 mb-1">局数</div>
                  <div className="text-2xl font-bold text-red-800" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                    {result.ju.type}{result.ju.number}
                  </div>
                  <div className="text-xs text-gray-500">局</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center border border-blue-200/50">
                  <div className="text-xs text-gray-500 mb-1">值符</div>
                  <div className="text-lg font-bold text-blue-800" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                    {result.zhiFu.star}
                  </div>
                  <div className="text-xs text-gray-500">落{result.zhiFu.position}宫</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 text-center border border-green-200/50">
                  <div className="text-xs text-gray-500 mb-1">值使</div>
                  <div className="text-lg font-bold text-green-800" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                    {result.zhiShi.gate}
                  </div>
                  <div className="text-xs text-gray-500">落{result.zhiShi.position}宫</div>
                </div>
              </div>

              {/* 次要信息 - 一排 */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 rounded-full">
                  <span className="text-gray-500 mr-1">节气:</span>
                  <span className="font-medium text-gray-800">{result.timeInfo.solarTerm || '-'}</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-1 bg-amber-100 rounded-full">
                  <span className="text-amber-600 mr-1">元:</span>
                  <span className="font-medium text-amber-800">{result.yuan}</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 rounded-full">
                  <span className="text-purple-600 mr-1">旬首:</span>
                  <span className="font-medium text-purple-800">{result.timeInfo.xunShou}</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-1 bg-red-100 rounded-full">
                  <span className="text-red-600 mr-1">空亡:</span>
                  <span className="font-medium text-red-800">{result.timeInfo.voidness?.join('、') || '无'}</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 rounded-full">
                  <span className="text-blue-600 mr-1">阳历:</span>
                  <span className="font-medium text-blue-800">{result.timeInfo.solarDate}</span>
                </span>
                <span className="inline-flex items-center px-2.5 py-1 bg-green-100 rounded-full">
                  <span className="text-green-600 mr-1">农历:</span>
                  <span className="font-medium text-green-800">{result.timeInfo.lunarDate}</span>
                </span>
              </div>
            </div>

            {/* 问题类型选择 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-amber-200/50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 bg-red-600 rounded" />
                <h3 className="text-lg font-bold text-red-900">选择问事类型（用神分析）</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {currentQuestionType ? (
                  <>当前选择：<strong className="text-red-700">{currentQuestionType.label}</strong>，用神为<strong className="text-purple-700">{currentQuestionType.yongshen}</strong>。下方解析将重点围绕此用神进行分析。</>
                ) : '请选择您要占卜的事项类型，系统将根据类型选取对应用神进行分析'
                }
              </p>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {QUESTION_TYPES.map((qt) => (
                  <button
                    key={qt.key}
                    type="button"
                    onClick={() => setQuestionType(qt.key)}
                    className={`flex flex-col items-center py-3 px-1 rounded-xl border-2 transition-all ${
                      questionType === qt.key
                        ? 'border-red-700 bg-red-50 shadow-md transform scale-105'
                        : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50'
                    }`}
                  >
                    <span className="text-lg font-bold mb-1" style={{ fontFamily: 'Noto Serif SC, serif', color: questionType === qt.key ? '#b91c1c' : '#374151' }}>
                      {qt.icon}
                    </span>
                    <span className="text-xs font-medium" style={{ color: questionType === qt.key ? '#b91c1c' : '#6b7280' }}>
                      {qt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 奇门盘面 - SVG */}
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-amber-200/50 p-5 overflow-x-auto">
              <QimenChart
                result={result as any}
                selectedPosition={selectedPosition}
                onSelectPosition={setSelectedPosition}
              />
            </div>

            {/* 选中宫位详解 */}
            {selectedPalace && (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border-l-4 border-l-red-500 border border-amber-200/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                    <span className="w-1 h-5 bg-red-600 rounded" />
                    {selectedPalace.trigram}宫（{TRIGRAM_DIRECTION[selectedPalace.trigram] || '中'}）详解
                  </h3>
                  <button
                    onClick={() => setSelectedPosition(null)}
                    className="text-gray-400 hover:text-red-700 text-sm"
                  >
                    关闭 ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 八神 */}
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <h4 className="font-bold text-purple-800 text-sm mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-full" />
                      八神 · {selectedPalace.deity}
                    </h4>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      {BASHEN_INTERPRETATION[selectedPalace.deity]?.meaning || '神盘守护，洞察先机'}
                    </p>
                  </div>

                  {/* 九星 */}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      九星 · {selectedPalace.star}
                    </h4>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {JIUXING_INTERPRETATION[selectedPalace.star]?.meaning || '星曜临宫，能量显现'}
                    </p>
                  </div>

                  {/* 八门 */}
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                      八门 · {selectedPalace.gate}
                    </h4>
                    {(() => {
                      const gateInfo = BAMEN_INTERPRETATION[selectedPalace.gate];
                      return gateInfo ? (
                        <>
                          <span className={`text-xs px-2 py-0.5 rounded inline-block ${getGateLevel(selectedPalace.gate)} font-medium`}>
                            {gateInfo.level}
                          </span>
                          <p className="text-xs text-green-700 mt-2 leading-relaxed">{gateInfo.meaning}</p>
                          <p className="text-xs text-green-600 mt-1">💡 建议：{gateInfo.advice}</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500">门星信息暂缺</p>
                      );
                    })()}
                  </div>

                  {/* 天盘/地盘 */}
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <h4 className="font-bold text-orange-800 text-sm mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-orange-500 rounded-full" />
                      天盘 / 地盘
                    </h4>
                    <div className="flex items-center justify-center gap-4 my-2">
                      <span className="text-2xl font-bold text-red-600" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                        {selectedPalace.heavenlyStem}
                      </span>
                      <span className="text-gray-400 text-xl">↓</span>
                      <span className="text-2xl font-bold text-gray-600" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                        {selectedPalace.earthlyStem}
                      </span>
                    </div>
                    <p className="text-xs text-orange-700 text-center">
                      天盘{selectedPalace.heavenlyStem}落{selectedPalace.trigram}宫<br />
                      地盘{selectedPalace.earthlyStem}守{selectedPalace.trigram}宫
                    </p>
                    {/* 十干克应 */}
                    {(() => {
                      const stemKey = `${selectedPalace.heavenlyStem}${selectedPalace.earthlyStem}`;
                      const pattern = TEN_STEM_PATTERNS[stemKey];
                      if (pattern) {
                        return (
                          <div className="mt-2 p-2 bg-white/70 rounded-lg">
                            <div className={`text-xs font-bold ${
                              pattern.level.includes('大吉') ? 'text-green-700' :
                              pattern.level.includes('吉') ? 'text-green-600' :
                              pattern.level.includes('大凶') ? 'text-red-700' :
                              pattern.level.includes('凶') ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {pattern.name}（{pattern.level}）
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">{pattern.description}</p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* 吉凶格局 */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedPalace.auspiciousPatterns?.map((p, i) => (
                    <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-medium border border-green-200">
                      ✨ 吉 {p.name}
                    </span>
                  ))}
                  {selectedPalace.inauspiciousPatterns?.map((p, i) => (
                    <span key={i} className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-xs font-medium border border-red-200">
                      ⚠️ 凶 {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 方位吉凶分析 */}
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-amber-200/50 p-5">
              <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-red-600 rounded" />
                方位吉凶
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <h4 className="font-bold text-green-800 text-sm mb-3 flex items-center gap-1">
                    <span>✅</span> 吉利方位
                  </h4>
                  {directionAnalysis.auspicious.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {directionAnalysis.auspicious.map((d, i) => (
                        <span key={i} className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-green-600">暂无特别吉利的方位</p>
                  )}
                </div>
                <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200">
                  <h4 className="font-bold text-red-800 text-sm mb-3 flex items-center gap-1">
                    <span>⚠️</span> 不利方位
                  </h4>
                  {directionAnalysis.inauspicious.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {directionAnalysis.inauspicious.map((d, i) => (
                        <span key={i} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200">
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">暂无特别凶险的方位</p>
                  )}
                </div>
              </div>
            </div>

            {/* 格局分析 */}
            {result.specialPatterns && (
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-amber-200/50 p-5">
                <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-red-600 rounded" />
                  格局分析
                </h3>
                {result.specialPatterns.fuYinFanYin?.description && (
                  <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <h4 className="font-bold text-purple-800 text-sm mb-2">伏吟/反吟</h4>
                    {result.specialPatterns.fuYinFanYin.description.map((d, i) => (
                      <p key={i} className="text-xs text-purple-700 leading-relaxed">{d}</p>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.specialPatterns.auspiciousPatterns && result.specialPatterns.auspiciousPatterns.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <h4 className="font-bold text-green-700 text-sm mb-2">🏆 吉格</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.specialPatterns.auspiciousPatterns.map((p, i) => (
                          <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-medium border border-green-200">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.specialPatterns.inauspiciousPatterns && result.specialPatterns.inauspiciousPatterns.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200">
                      <h4 className="font-bold text-red-700 text-sm mb-2">⚠️ 凶格</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.specialPatterns.inauspiciousPatterns.map((p, i) => (
                          <span key={i} className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-xs font-medium border border-red-200">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== 深度解读 ===== */}
            {detailedAnalysis && (
              <>
                {/* 用神分析 - 根据问事类型 */}
                {detailedAnalysis.yongshenAnalysis && (
                  <div className="bg-gradient-to-br from-amber-50 via-white to-yellow-50 rounded-2xl shadow-lg border-2 border-amber-300/50 p-5">
                    <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 bg-red-600 rounded" />
                      用神分析 · {detailedAnalysis.yongshenAnalysis.yongshenName}
                      {currentQuestionType && (
                        <span className="text-sm font-normal text-gray-500">（{currentQuestionType.label}）</span>
                      )}
                    </h3>
                    
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                      {detailedAnalysis.yongshenAnalysis.analysis}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detailedAnalysis.yongshenAnalysis.timing && (
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="text-xs font-bold text-blue-700 mb-1">⏱️ 应期判断</div>
                          <p className="text-xs text-blue-600 leading-relaxed">{detailedAnalysis.yongshenAnalysis.timing}</p>
                        </div>
                      )}
                      {detailedAnalysis.yongshenAnalysis.direction && (
                        <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                          <div className="text-xs font-bold text-green-700 mb-1">📍 吉利方位</div>
                          <p className="text-xs text-green-600">{detailedAnalysis.yongshenAnalysis.direction}</p>
                        </div>
                      )}
                    </div>

                    {detailedAnalysis.yongshenAnalysis.advice && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <div className="text-xs font-bold text-amber-700 mb-1">💡 针对性建议</div>
                        <p className="text-xs text-amber-700 leading-relaxed">{detailedAnalysis.yongshenAnalysis.advice}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 格局深度分析 */}
                {detailedAnalysis.patternDetails.length > 0 && (
                  <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-amber-200/50 p-5">
                    <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                      <span className="w-1 h-5 bg-red-600 rounded" />
                      格局深度分析
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detailedAnalysis.patternDetails.map((p, i) => (
                        <div
                          key={i}
                          className={`p-4 rounded-xl border ${
                            p.level.includes('大吉') ? 'bg-green-50 border-green-300' :
                            p.level.includes('吉') ? 'bg-green-50/70 border-green-200' :
                            p.level.includes('大凶') ? 'bg-red-50 border-red-300' :
                            p.level.includes('凶') ? 'bg-red-50/70 border-red-200' :
                            'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`font-bold text-sm ${
                              p.level.includes('大吉') ? 'text-green-700' :
                              p.level.includes('吉') ? 'text-green-600' :
                              p.level.includes('大凶') ? 'text-red-700' :
                              p.level.includes('凶') ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {p.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-white/60 text-gray-600 font-medium">
                              {p.level}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{p.condition}</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{p.influence}</p>
                          {p.classicSource && (
                            <p className="text-xs text-purple-600 italic mt-2">{p.classicSource}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2 font-medium">💡 建议：{p.advice}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 综合断局 - 根据问事类型 */}
                {detailedAnalysis.overallAnalysis && (
                  <div className="bg-gradient-to-br from-red-50 via-white to-amber-50 rounded-2xl shadow-lg border-2 border-red-200 p-5">
                    <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 bg-red-600 rounded" />
                      综合断局
                      {currentQuestionType && (
                        <span className="text-sm font-normal text-gray-500">· {currentQuestionType.label}专项分析</span>
                      )}
                    </h3>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {detailedAnalysis.overallAnalysis}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
