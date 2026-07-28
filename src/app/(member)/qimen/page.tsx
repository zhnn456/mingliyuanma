'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { BAMEN_INTERPRETATION, JIUXING_INTERPRETATION, BASHEN_INTERPRETATION } from '@/lib/interpretation/qimen';
import { QUESTION_TYPES, generateQimenDetailedAnalysis } from '@/lib/interpretation/qimen-detailed';
import { useToast } from '@/components/Toast';

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
  timeInfo: { solarDate: string; lunarDate: string; chineseYear: string; chineseMonth: string; chineseDay: string; chineseTime: string; timeName: string; solarTerm: string; xunShou: string; voidness: string[] };
  fourPillars: { year: { stem: string; branch: string }; month: { stem: string; branch: string }; day: { stem: string; branch: string }; hour: { stem: string; branch: string } };
  ju: { type: string; number: number };
  yuan: string;
  zhiFu: { star: string; position: number };
  zhiShi: { gate: string; position: number };
  palaces: QimenPalace[];
  specialPatterns: { fuYinFanYin?: { description: string[] }; wuBuYuShi?: { isWuBuYuShi: boolean; description?: string }; auspiciousPatterns?: Array<{ name: string }>; inauspiciousPatterns?: Array<{ name: string }> };
}

// 九宫格排列位置映射 (后天八卦方位)
const GRID_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];

// 八卦方位
const TRIGRAM_DIRECTION: Record<string, string> = {
  '坎': '北', '坤': '西南', '震': '东', '巽': '东南',
  '乾': '西北', '兑': '西', '艮': '东北', '离': '南',
};

// 宫位吉凶等级
const PALACE_LEVELS: Record<number, string> = {
  1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火',
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

export default function QimenPage() {
  const { data: session } = useSession();
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-12">
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 页面标题 */}
        <div className="page-header">
          <div className="section-label justify-center">QI MEN DUN JIA</div>
          <h1 className="page-header-title">
            <span>奇门遁甲</span>
          </h1>
          <p className="page-header-subtitle">时家奇门排盘 · 观天时地利 · 断吉凶休咎</p>
        </div>

        {/* 输入表单 */}
        <div className="form-card mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="toggle-group">
                <button type="button" onClick={() => setUseCurrentTime(true)}
                  className={`toggle-btn ${useCurrentTime ? 'active' : ''}`}>
                  当前时间起局
                </button>
                <button type="button" onClick={() => setUseCurrentTime(false)}
                  className={`toggle-btn ${!useCurrentTime ? 'active' : ''}`}>
                  指定时间起局
                </button>
              </div>
            </div>
            {!useCurrentTime && (
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div>
                  <label className="form-label">日期</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">时间</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full max-w-md mx-auto block btn-primary text-lg disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  排盘中...
                </span>
              ) : '开始排盘'}
            </button>
          </form>
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
            {/* 排盘信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '四柱', value: `${result.fourPillars.year.stem}${result.fourPillars.year.branch} ${result.fourPillars.month.stem}${result.fourPillars.month.branch} ${result.fourPillars.day.stem}${result.fourPillars.day.branch} ${result.fourPillars.hour.stem}${result.fourPillars.hour.branch}` },
                { label: '局数', value: `${result.ju.type}${result.ju.number}局`, highlight: true },
                { label: '元', value: result.yuan },
                { label: '节气', value: result.timeInfo.solarTerm || '-' },
                { label: '值符', value: result.zhiFu.star, highlight: true },
                { label: '值使', value: result.zhiShi.gate, highlight: true },
                { label: '旬首', value: result.timeInfo.xunShou },
                { label: '空亡', value: result.timeInfo.voidness?.join('、') || '-' },
              ].map((item) => (
                <div key={item.label} className={`card !p-3 text-center ${item.highlight ? 'border-gold-300 bg-gradient-to-br from-white to-gold-50' : ''}`}>
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className={`font-bold text-sm ${item.highlight ? 'chinese-red' : 'text-gray-900'}`}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* 问题类型选择 */}
            <div className="card !p-4">
              <label className="block text-sm font-bold text-gray-700 mb-3">选择问事类型（用神分析）</label>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {QUESTION_TYPES.map((qt) => (
                  <button
                    key={qt.key}
                    type="button"
                    onClick={() => setQuestionType(qt.key)}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg border-2 transition-all ${
                      questionType === qt.key
                        ? 'border-red-700 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg font-bold mb-0.5" style={{ fontFamily: 'Noto Serif SC, serif' }}>{qt.icon}</span>
                    <span className="text-[10px]">{qt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 九宫格盘面 */}
            <div className="card !p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-red-800 to-red-900 text-white px-4 py-3">
                <h2 className="font-bold text-lg" style={{ fontFamily: 'Noto Serif SC, STSong, SimSun, serif' }}>奇门盘面</h2>
                <p className="text-xs text-red-200 mt-0.5">点击宫位查看详解 · 天盘干/地盘干 · 八门·九星·八神</p>
              </div>
              <div className="grid grid-cols-3 gap-0">
                {GRID_ORDER.map((pos) => {
                  const palace = getPalaceByPosition(pos);
                  const isSelected = selectedPosition === pos;

                  // 中五宫
                  if (!palace || pos === 5) {
                    return (
                      <div key={pos} className="bg-gradient-to-b from-red-800 to-red-900 text-white p-3 min-h-[150px] flex items-center justify-center border border-red-700">
                        <div className="text-center">
                          <div className="text-lg font-bold">{result.ju.type}</div>
                          <div className="text-3xl font-bold mt-1">{result.ju.number}</div>
                          <div className="text-sm mt-1">局</div>
                          <div className="text-xs mt-2 opacity-70">{result.yuan}</div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={pos}
                      onClick={() => setSelectedPosition(isSelected ? null : pos)}
                      className={`p-2 min-h-[150px] border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-red-50 border-red-500 ring-2 ring-red-400 z-10'
                          : palace.isZhiFu
                          ? 'bg-yellow-50/80 border-parchment-200 hover:bg-yellow-50'
                          : palace.isZhiShi
                          ? 'bg-blue-50/80 border-parchment-200 hover:bg-blue-50'
                          : 'bg-white/90 border-parchment-200 hover:bg-parchment-50'
                      }`}
                    >
                      {/* 宫位头 */}
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-red-700 text-xs">{palace.trigram}宫</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-400">{TRIGRAM_DIRECTION[palace.trigram] || ''}</span>
                          <span className="text-[10px] text-gray-400">{pos}宫</span>
                        </div>
                      </div>

                      {/* 八神 */}
                      <div className="text-purple-600 text-[11px] font-medium leading-tight">{palace.deity}</div>
                      {/* 九星 */}
                      <div className="text-blue-600 text-[11px] leading-tight">{palace.star} {palace.horse ? '🐴' : ''}</div>
                      {/* 八门 */}
                      <div className="text-green-700 text-[11px] font-medium leading-tight">{palace.gate}</div>
                      {/* 天盘干 / 地盘干 */}
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-red-600 text-xs font-bold">{palace.heavenlyStem}</span>
                        <span className="text-gray-300 text-[10px]">/</span>
                        <span className="text-gray-500 text-[10px]">{palace.earthlyStem}</span>
                      </div>
                      {/* 标记 */}
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {palace.isZhiFu && <span className="bg-yellow-200 text-yellow-800 px-1 rounded text-[9px]">值符</span>}
                        {palace.isZhiShi && <span className="bg-blue-200 text-blue-800 px-1 rounded text-[9px]">值使</span>}
                        {palace.voidness?.hasVoidness && <span className="bg-gray-200 text-gray-600 px-1 rounded text-[9px]">空</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 选中宫位详解 */}
            {selectedPalace && (
              <div className="card border-l-4 border-l-red-500 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title !mb-0">
                    {selectedPalace.trigram}宫（{TRIGRAM_DIRECTION[selectedPalace.trigram] || '中'}）详解
                  </h2>
                  <button onClick={() => setSelectedPosition(null)} className="text-xs text-gray-400 hover:text-red-700">关闭 ✕</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 八神 */}
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-bold text-purple-800 text-sm mb-1">八神 · {selectedPalace.deity}</h4>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      {BASHEN_INTERPRETATION[selectedPalace.deity]?.meaning || '神盘守护，洞察先机'}
                    </p>
                  </div>
                  {/* 九星 */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-800 text-sm mb-1">九星 · {selectedPalace.star}</h4>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {JIUXING_INTERPRETATION[selectedPalace.star]?.meaning || '星曜临宫，能量显现'}
                    </p>
                  </div>
                  {/* 八门 */}
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-bold text-green-800 text-sm mb-1">八门 · {selectedPalace.gate}</h4>
                    {(() => {
                      const gateInfo = BAMEN_INTERPRETATION[selectedPalace.gate];
                      return gateInfo ? (
                        <>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getGateLevel(selectedPalace.gate)}`}>
                            {gateInfo.level}
                          </span>
                          <p className="text-xs text-green-700 mt-1 leading-relaxed">{gateInfo.meaning}</p>
                          <p className="text-xs text-green-600 mt-1">建议：{gateInfo.advice}</p>
                        </>
                      ) : <p className="text-xs text-gray-500">门星信息暂缺</p>;
                    })()}
                  </div>
                  {/* 天盘干 + 地盘干 */}
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-bold text-orange-800 text-sm mb-1">天盘/地盘</h4>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-red-700">{selectedPalace.heavenlyStem}</span>
                      <span className="text-gray-300">↓</span>
                      <span className="text-lg font-bold text-gray-600">{selectedPalace.earthlyStem}</span>
                    </div>
                    <p className="text-xs text-orange-700">
                      天盘{selectedPalace.heavenlyStem}落{selectedPalace.trigram}宫，
                      地盘{selectedPalace.earthlyStem}守{selectedPalace.trigram}宫
                    </p>
                  </div>
                </div>
                {/* 吉凶格局 */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedPalace.auspiciousPatterns?.map((p, i) => (
                    <span key={i} className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs border border-green-200">
                      吉 {p.name}
                    </span>
                  ))}
                  {selectedPalace.inauspiciousPatterns?.map((p, i) => (
                    <span key={i} className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs border border-red-200">
                      凶 {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 方位吉凶分析 */}
            <div className="card">
              <h2 className="card-title">方位吉凶</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-1">✅ 吉利方位</h3>
                  {directionAnalysis.auspicious.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {directionAnalysis.auspicious.map((d, i) => (
                        <span key={i} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs border border-green-200">{d}</span>
                      ))}
                    </div>
                  ) : <p className="text-xs text-green-600">暂无特别吉利的方位</p>}
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-1">⚠️ 不利方位</h3>
                  {directionAnalysis.inauspicious.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {directionAnalysis.inauspicious.map((d, i) => (
                        <span key={i} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs border border-red-200">{d}</span>
                      ))}
                    </div>
                  ) : <p className="text-xs text-red-600">暂无特别凶险的方位</p>}
                </div>
              </div>
            </div>

            {/* 格局分析 */}
            {result.specialPatterns && (
              <div className="card">
                <h2 className="card-title">格局分析</h2>
                {result.specialPatterns.fuYinFanYin?.description && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-bold text-purple-800 text-sm mb-2">伏吟/反吟</h3>
                    {result.specialPatterns.fuYinFanYin.description.map((d, i) => (
                      <p key={i} className="text-xs text-purple-700">{d}</p>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.specialPatterns.auspiciousPatterns && result.specialPatterns.auspiciousPatterns.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-bold text-green-700 text-sm mb-2">吉格</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {result.specialPatterns.auspiciousPatterns.map((p, i) => (
                          <span key={i} className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">{p.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.specialPatterns.inauspiciousPatterns && result.specialPatterns.inauspiciousPatterns.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <h3 className="font-bold text-red-700 text-sm mb-2">凶格</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {result.specialPatterns.inauspiciousPatterns.map((p, i) => (
                          <span key={i} className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">{p.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 八门详解 */}
            <div className="card">
              <h2 className="card-title">八门详解</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.palaces.filter(p => p.position !== 5).map((palace) => {
                  const gateInfo = BAMEN_INTERPRETATION[palace.gate];
                  if (!gateInfo) return null;
                  return (
                    <div key={palace.position} className="flex items-start gap-3 p-3 bg-parchment-50 rounded-lg border border-parchment-200">
                      <div className="flex-shrink-0 text-center w-14">
                        <div className="text-xs font-bold text-red-700">{palace.trigram}宫</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${getGateLevel(palace.gate)}`}>
                          {gateInfo.level}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-800">{palace.gate}</div>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{gateInfo.meaning}</p>
                        <p className="text-xs text-purple-600 mt-0.5">建议：{gateInfo.advice}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 综合判断 */}
            <div className="card bg-gradient-to-br from-red-50 via-white to-yellow-50 border border-red-200">
              <h2 className="card-title chinese-red">奇门综合判断</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>当前时局为 <strong className="chinese-red">{result.ju.type}{result.ju.number}局</strong>，{result.yuan}，节气 {result.timeInfo.solarTerm || '-'}。</p>
                <p>值符 <strong className="text-yellow-700">{result.zhiFu.star}</strong> 落宫，值使 <strong className="text-blue-700">{result.zhiShi.gate}</strong> 落宫。</p>
                {result.timeInfo.voidness && result.timeInfo.voidness.length > 0 && (
                  <p>空亡方位：<strong className="text-gray-500">{result.timeInfo.voidness.join('、')}</strong>，此方位不宜行事。</p>
                )}
                <div className="divider-gold my-2" />
                <p className="font-medium">总体建议</p>
                <p>{BAMEN_INTERPRETATION[result.zhiShi.gate]?.advice || '宜审时度势，谨慎行事。'}</p>
                {/* 吉利方位建议 */}
                {directionAnalysis.auspicious.length > 0 && (
                  <p className="mt-2">
                    今日吉利方位：<strong className="text-green-700">{directionAnalysis.auspicious.slice(0, 3).join('、')}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* ===== 深度解读 ===== */}
            {detailedAnalysis && (
              <>
                {/* 用神分析 */}
                {detailedAnalysis.yongshenAnalysis.analysis && (
                  <div className="card border-l-4 border-l-gold-500">
                    <h2 className="card-title">用神分析 · {detailedAnalysis.yongshenAnalysis.yongshenName}</h2>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-3">
                      {detailedAnalysis.yongshenAnalysis.analysis}
                    </div>
                    {detailedAnalysis.yongshenAnalysis.timing && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-2">
                        <span className="text-xs font-bold text-blue-700">应期判断</span>
                        <p className="text-xs text-blue-600 mt-1">{detailedAnalysis.yongshenAnalysis.timing}</p>
                      </div>
                    )}
                    {detailedAnalysis.yongshenAnalysis.advice && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-xs font-bold text-green-700">建议</span>
                        <p className="text-xs text-green-600 mt-1">{detailedAnalysis.yongshenAnalysis.advice}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 格局深度分析 */}
                {detailedAnalysis.patternDetails.length > 0 && (
                  <div className="card">
                    <h2 className="card-title">格局深度分析</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detailedAnalysis.patternDetails.map((p, i) => (
                        <div key={i} className={`p-3 rounded-lg border ${
                          p.level.includes('吉') ? 'bg-green-50 border-green-200' :
                          p.level.includes('凶') ? 'bg-red-50 border-red-200' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-bold text-sm ${
                              p.level.includes('大吉') ? 'text-green-700' :
                              p.level.includes('吉') ? 'text-green-600' :
                              p.level.includes('大凶') ? 'text-red-700' :
                              p.level.includes('凶') ? 'text-red-600' : 'text-gray-600'
                            }`}>{p.name}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-white/60 text-gray-600">{p.level}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{p.condition}</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{p.influence}</p>
                          {p.classicSource && (
                            <p className="text-xs text-purple-600 italic mt-1">{p.classicSource}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">建议：{p.advice}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 综合断局 */}
                {detailedAnalysis.overallAnalysis && (
                  <div className="card bg-gradient-to-br from-red-50 via-white to-yellow-50 border border-red-200">
                    <h2 className="card-title chinese-red">深度综合断局</h2>
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
