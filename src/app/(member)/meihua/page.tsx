'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { generateMeihuaInterpretation } from '@/lib/interpretation/meihua';
import { MEIHUA_QUESTION_TYPES, type MeihuaDetailedAnalysis } from '@/lib/interpretation/meihua-detailed';
import { HexagramLookup } from '@/components/HexagramLookup';
import { InterpretPaywall } from '@/components/InterpretPaywall';
import { useToast } from '@/components/Toast';
import Disclaimer from '@/components/Disclaimer';

interface MeihuaResult {
  method: string;
  upperGua: { name: string; symbol: string; element: string; nature: string };
  lowerGua: { name: string; symbol: string; element: string; nature: string };
  dongYao: number;
  benGua: { name: string; meaning: string; lines: number[] };
  huGua: { name: string; meaning: string; lines: number[] };
  bianGua: { name: string; meaning: string; lines: number[] };
  tiYong: { ti: string; yong: string; relation: string };
}

type MethodType = 'number' | 'time' | 'text' | 'coin' | 'random' | 'date' | 'report' | 'direction' | 'color' | 'sound' | 'name';

// 八卦方位选项
const BAGUA_NAMES = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
const BAGUA_COLORS: Record<string, string> = {
  '乾': '#D4AF37', '兑': '#C0C0C0', '离': '#DC143C', '震': '#228B22',
  '巽': '#32CD32', '坎': '#000080', '艮': '#8B4513', '坤': '#F5DEB3'
};

// 颜色选项
const COLOR_OPTIONS = [
  '白色', '金色', '银色', '黑色', '蓝色', '红色', '紫色', '绿色', '青色', '黄色', '棕色', '褐色'
];

function HexagramLines({ lines, dongYao, label, size = 'normal' }: { lines: number[]; dongYao?: number; label: string; size?: 'normal' | 'large' }) {
  const h = size === 'large' ? 'h-2.5' : 'h-1.5';
  const w = size === 'large' ? 'w-20' : 'w-16';
  return (
    <div className="text-center">
      <div className="text-sm font-bold text-gray-700 mb-3">{label}</div>
      <div className="space-y-2">
        {lines.map((line, i) => {
          const realIdx = lines.length - 1 - i;
          const isDong = dongYao !== undefined && realIdx + 1 === dongYao;
          return (
            <div key={i} className={`flex items-center justify-center gap-1 ${isDong ? 'text-red-600' : 'text-gray-800'}`}>
              {line === 1 ? (
                <div className={`${w} ${h} bg-current rounded`} />
              ) : (
                <div className="flex gap-2">
                  <div className={`${size === 'large' ? 'w-9' : 'w-7'} ${h} bg-current rounded`} />
                  <div className={`${size === 'large' ? 'w-9' : 'w-7'} ${h} bg-current rounded`} />
                </div>
              )}
              {isDong && <span className="text-xs ml-1 font-bold">← 动爻</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MeihuaPage() {
  const { user: session } = useAuth();
  const [chartData, setChartData] = useState<MeihuaResult | null>(null);
  const [interpretData, setInterpretData] = useState<MeihuaResult | null>(null);
  const [paywall, setPaywall] = useState<{ status: 401 | 402; cost?: number; balance?: number } | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [loadingInterpret, setLoadingInterpret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<MethodType>('number');
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [num3, setNum3] = useState('');
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [flips, setFlips] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [showInterpretation, setShowInterpretation] = useState(true);
  const [activeTab, setActiveTab] = useState<'divination' | 'lookup'>('divination');
  const [questionType, setQuestionType] = useState('general');
  const [detailedAnalysis, setDetailedAnalysis] = useState<MeihuaDetailedAnalysis | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const { addToast } = useToast();
  const [initialLoaded, setInitialLoaded] = useState(false);

  // 新增状态：报数、方位、颜色、声音、姓名起卦
  const [reportNums, setReportNums] = useState<string[]>(['', '', '']);
  const [upperDir, setUpperDir] = useState('乾');
  const [lowerDir, setLowerDir] = useState('兑');
  const [directionDongYao, setDirectionDongYao] = useState('');
  const [upperColor, setUpperColor] = useState('红色');
  const [lowerColor, setLowerColor] = useState('黄色');
  const [soundCount, setSoundCount] = useState('3');
  const [soundDuration, setSoundDuration] = useState('5');
  const [surname, setSurname] = useState('');
  const [givenName, setGivenName] = useState('');

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
      fetch('/api/user/latest?type=meihua')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.record?.result) {
            setChartData(data.record.result);
            // 尝试从保存的数据中恢复深度解读
            if (data.record.detailedAnalysis) {
              setInterpretData(data.record.result);
              setDetailedAnalysis(data.record.detailedAnalysis);
            }
          }
        })
        .catch(() => {});
    }
  }, [session, initialLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body: any = { method, questionType };
      if (method === 'number') { body.num1 = num1; body.num2 = num2; body.num3 = num3; }
      else if (method === 'text') { body.text = text; }
      else if (method === 'coin') { body.flips = flips; }
      else if (method === 'date') { body.date = date; }
      else if (method === 'report') {
        body.nums = reportNums.filter(n => n !== '').map(Number);
      }
      else if (method === 'direction') {
        body.upperDir = upperDir;
        body.lowerDir = lowerDir;
        if (directionDongYao) body.dongYao = directionDongYao;
      }
      else if (method === 'color') {
        body.upperColor = upperColor;
        body.lowerColor = lowerColor;
      }
      else if (method === 'sound') {
        body.soundCount = soundCount;
        body.duration = soundDuration;
      }
      else if (method === 'name') {
        body.surname = surname;
        body.givenName = givenName;
      }

      const response = await fetch('/api/meihua', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, mode: 'chart' }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || '起卦失败');
      setChartData(json.result);
      setInterpretData(null);
      setDetailedAnalysis(null);
      setPaywall(null);
      setFormData(body);
      setShowInterpretation(false);
      addToast('success', '起卦完成！');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '起卦失败';
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
      const response = await fetch('/api/meihua', {
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
          addToast('error', json.error || '积分不足，请充值');
        } else {
          const balance = await fetchBalance();
          setPaywall({ status: 402, cost: json.cost || 50, balance });
          if (json.result) setChartData(json.result);
        }
      } else if (!response.ok) {
        throw new Error(json.error || '解读失败');
      } else {
        setInterpretData(json.result);
        setDetailedAnalysis(json.detailedAnalysis || null);
        setPaywall(null);
        setShowInterpretation(true);
        addToast('success', '解读完成');
      }
    } catch (err) {
      setPaywall(null);
      const msg = err instanceof Error ? err.message : '解读失败';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoadingInterpret(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => { window.print(); setIsPrinting(false); }, 300);
  };

  const interpretation = displayResult ? generateMeihuaInterpretation(displayResult) : null;

  const getLevelColor = (level: string) => {
    if (level === '大吉') return 'bg-green-100 text-green-800 border-green-300';
    if (level === '小吉') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (level === '平') return 'bg-gray-100 text-gray-800 border-gray-300';
    if (level === '小凶') return 'bg-orange-100 text-orange-800 border-orange-300';
    if (level === '凶') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const methodLabels: Record<MethodType, string> = {
    number: '数字', time: '时间', text: '文字', coin: '硬币', random: '随机', date: '日期',
    report: '报数', direction: '方位', color: '颜色', sound: '声音', name: '姓名'
  };

  const methodDescriptions: Record<MethodType, string> = {
    number: '输入三个数字，分别对应上卦、下卦和动爻',
    time: '以当下年月日时起卦，适用于时效问题',
    text: '输入文字，按笔画起卦',
    coin: '模拟三枚硬币六次投掷',
    random: '系统随机生成卦象',
    date: '选择日期起卦',
    report: '心中默念后报出数字（1-4个）',
    direction: '选择方位对应八卦起卦',
    color: '选择颜色对应五行起卦',
    sound: '根据声音次数和时长起卦',
    name: '根据姓名笔画起卦'
  };

  const handleRandomCoin = () => {
    setFlips(Array.from({ length: 6 }, () => Math.floor(Math.random() * 4)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50">
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
      <div className="relative z-10">
        {/* 页面标题 */}
        <div className="page-header">
          <div className="section-label justify-center">MEI HUA YI SHU</div>
          <h1 className="page-header-title">
            <span>梅花易数</span>
          </h1>
          <p className="page-header-subtitle">以数起卦，以象会意，古典哲学思维的趣味呈现</p>
        </div>

        {/* 主Tab切换 */}
        <div className="tab-nav mb-6">
          <button
            onClick={() => setActiveTab('divination')}
            className={`tab-btn ${activeTab === 'divination' ? 'active' : ''}`}
          >
            起卦占事
          </button>
          <button
            onClick={() => setActiveTab('lookup')}
            className={`tab-btn ${activeTab === 'lookup' ? 'active' : ''}`}
          >
            64卦速查
          </button>
        </div>

        {activeTab === 'lookup' && (
          <div className="card p-6">
            <h2 className="card-title text-center">六十四卦速查</h2>
            <HexagramLookup />
          </div>
        )}

        {activeTab === 'divination' && (
          <>
            {/* 输入表单 */}
            <div className="form-card mb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 起卦方式选择 - 精美卡片式 */}
                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3 text-center">
                    <span className="inline-block bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">选择起卦方式</span>
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {(['number', 'time', 'text', 'coin', 'report', 'direction', 'color', 'sound', 'name', 'random', 'date'] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setMethod(m)}
                        className={`p-3 rounded-xl font-medium text-sm transition-all ${
                          method === m 
                            ? 'bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-lg scale-105' 
                            : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200 hover:border-amber-300'
                        }`}>
                        <div className="text-lg mb-0.5">
                          {m === 'number' ? '🔢' : m === 'time' ? '🕐' : m === 'text' ? '✏️' : 
                           m === 'coin' ? '🪙' : m === 'report' ? '📣' : m === 'direction' ? '🧭' :
                           m === 'color' ? '🎨' : m === 'sound' ? '🔊' : m === 'name' ? '👤' :
                           m === 'random' ? '🎲' : '📅'}
                        </div>
                        <div className="font-bold">{methodLabels[m]}</div>
                        <div className="text-xs opacity-75">起卦</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2 bg-amber-50 rounded-lg p-2">
                    💡 {methodDescriptions[method]}
                  </p>
                </div>

                {/* 问题类型选择 - 精致卡片式设计 */}
                <div>
                  <label className="block text-base font-bold text-gray-800 mb-3 text-center">
                    <span className="inline-block bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">测什么事？</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {MEIHUA_QUESTION_TYPES.map((q) => (
                      <button 
                        key={q.key} 
                        type="button" 
                        onClick={() => setQuestionType(q.key)}
                        className={`p-3 rounded-xl font-medium transition-all text-left ${
                          questionType === q.key 
                            ? 'bg-gradient-to-br from-amber-500 to-red-500 text-white shadow-lg scale-105' 
                            : 'bg-white text-gray-700 hover:bg-amber-50 border-2 border-gray-200 hover:border-amber-300'
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-2xl font-bold ${questionType === q.key ? 'text-white' : 'text-amber-600'}`}>
                            {q.icon}
                          </span>
                          <span className={`font-bold text-base ${questionType === q.key ? 'text-white' : 'text-gray-800'}`}>
                            {q.label}
                          </span>
                        </div>
                        <p className={`text-xs leading-snug ${questionType === q.key ? 'text-white/90' : 'text-gray-500'}`}>
                          {q.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 数字起卦 */}
                {method === 'number' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">上卦数</label>
                      <input type="number" value={num1} onChange={(e) => setNum1(e.target.value)} placeholder="第一个数" min="1"
                        className="form-input" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">下卦数</label>
                      <input type="number" value={num2} onChange={(e) => setNum2(e.target.value)} placeholder="第二个数" min="1"
                        className="form-input" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">动爻数</label>
                      <input type="number" value={num3} onChange={(e) => setNum3(e.target.value)} placeholder="第三个数" min="1"
                        className="form-input" required />
                    </div>
                  </div>
                )}

                {/* 报数起卦 */}
                {method === 'report' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 text-center">
                      心中默念所问之事，然后随意报1-4个数字<br/>
                      <span className="text-xs text-gray-400">1数配时辰起卦，2数分上下卦，3数第三爻为动爻，4数以上分前后</span>
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {reportNums.map((n, i) => (
                        <div key={i}>
                          <label className="block text-xs font-medium text-gray-500 mb-1">第{i + 1}个数</label>
                          <input 
                            type="number" 
                            value={n} 
                            onChange={(e) => {
                              const newNums = [...reportNums];
                              newNums[i] = e.target.value;
                              setReportNums(newNums);
                            }} 
                            placeholder="0-99"
                            className="form-input text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 方位起卦 */}
                {method === 'direction' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                      选择物体所在方位（上卦）和主体所在方位（下卦）<br/>
                      <span className="text-xs text-gray-400">例如：在南方(离)看西方(兑)的物体</span>
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">上卦（物体方位）</label>
                        <div className="grid grid-cols-4 gap-2">
                          {BAGUA_NAMES.map(name => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setUpperDir(name)}
                              className={`p-2 rounded-lg text-center transition-all ${
                                upperDir === name 
                                  ? 'bg-red-600 text-white shadow-md' 
                                  : 'bg-white border border-gray-200 hover:border-red-300'
                              }`}
                            >
                              <div className="text-xl">{name === '乾' ? '☰' : name === '兑' ? '☱' : name === '离' ? '☲' : name === '震' ? '☳' : name === '巽' ? '☴' : name === '坎' ? '☵' : name === '艮' ? '☶' : '☷'}</div>
                              <div className="text-xs font-medium">{name}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">下卦（主体方位）</label>
                        <div className="grid grid-cols-4 gap-2">
                          {BAGUA_NAMES.map(name => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setLowerDir(name)}
                              className={`p-2 rounded-lg text-center transition-all ${
                                lowerDir === name 
                                  ? 'bg-green-600 text-white shadow-md' 
                                  : 'bg-white border border-gray-200 hover:border-green-300'
                              }`}
                            >
                              <div className="text-xl">{name === '乾' ? '☰' : name === '兑' ? '☱' : name === '离' ? '☲' : name === '震' ? '☳' : name === '巽' ? '☴' : name === '坎' ? '☵' : name === '艮' ? '☶' : '☷'}</div>
                              <div className="text-xs font-medium">{name}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">动爻（可选，留空自动）</label>
                      <input 
                        type="number" 
                        value={directionDongYao}
                        onChange={(e) => setDirectionDongYao(e.target.value)}
                        min="1" max="6"
                        placeholder="1-6爻"
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

                {/* 颜色起卦 */}
                {method === 'color' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                      选择两种颜色分别作为上卦和下卦<br/>
                      <span className="text-xs text-gray-400">颜色对应五行：白/金→乾(金)，黑/蓝→坎(水)，红/紫→离(火)，绿/青→震(木)，黄/棕→坤(土)</span>
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">上卦颜色</label>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_OPTIONS.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setUpperColor(color)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                upperColor === color 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">下卦颜色</label>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_OPTIONS.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setLowerColor(color)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                lowerColor === color 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 声音起卦 */}
                {method === 'sound' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">声音次数（1-8次）</label>
                      <input type="number" value={soundCount} onChange={(e) => setSoundCount(e.target.value)} min="1" max="8"
                        className="form-input" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">持续时间（秒）</label>
                      <input type="number" value={soundDuration} onChange={(e) => setSoundDuration(e.target.value)} min="1" max="30"
                        className="form-input" required />
                    </div>
                  </div>
                )}

                {/* 姓名起卦 */}
                {method === 'name' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">姓氏</label>
                      <input type="text" value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="如：张"
                        className="form-input" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">名字</label>
                      <input type="text" value={givenName} onChange={(e) => setGivenName(e.target.value)} placeholder="如：三"
                        className="form-input" required />
                    </div>
                  </div>
                )}

                {/* 文字起卦 */}
                {method === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">输入文字（至少2个字）</label>
                      <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="如：天地" minLength={2}
                      className="form-input" required />
                  </div>
                )}

                {/* 硬币起卦 */}
                {method === 'coin' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">模拟掷6次硬币，每次3枚。正面数：0=全反(老阴)，1=二反一正(少阳)，2=一反二正(少阴)，3=全正(老阳)</p>
                    <div className="grid grid-cols-6 gap-3">
                      {flips.map((f, i) => (
                        <div key={i} className="text-center">
                          <label className="text-xs text-gray-500 block mb-1">第{i + 1}爻</label>
                          <select
                            value={f}
                            onChange={(e) => {
                              const newFlips = [...flips];
                              newFlips[i] = parseInt(e.target.value);
                              setFlips(newFlips);
                            }}
                            className="form-input text-center px-1"
                          >
                            <option value={0}>0正</option>
                            <option value={1}>1正</option>
                            <option value={2}>2正</option>
                            <option value={3}>3正</option>
                          </select>
                          <div className={`text-xs mt-1 font-medium ${f === 0 || f === 3 ? 'text-red-600' : 'text-gray-500'}`}>
                            {f === 0 ? '老阴⚋' : f === 1 ? '少阳⚊' : f === 2 ? '少阴⚋' : '老阳⚊'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={handleRandomCoin}
                      className="mx-auto block px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                      🎲 随机投掷
                    </button>
                  </div>
                )}

                {/* 随机起卦 */}
                {method === 'random' && (
                  <p className="text-gray-500 text-sm text-center">系统将随机生成上卦、下卦和动爻</p>
                )}

                {/* 日期起卦 */}
                {method === 'date' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择日期</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                      className="form-input" required />
                  </div>
                )}

                {/* 时间起卦 */}
                {method === 'time' && <p className="text-gray-500 text-sm text-center">将使用当前时间起卦</p>}

                <button type="submit" disabled={loading} className="w-full btn-primary text-lg disabled:opacity-50">
                  {loading ? '起卦中...' : '开始起卦'}
                </button>
              </form>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

            {(chartData || interpretData) && displayResult && (
              <div className="space-y-6 animate-fade-in">
                {/* 卦象展示 */}
                <div className="card">
                  <h2 className="card-title text-center">卦象</h2>
                  <div className="grid grid-cols-3 gap-8 mb-6">
                    <HexagramLines lines={displayResult.benGua.lines} dongYao={displayResult.dongYao} label={`本卦：${displayResult.benGua.name}`} size="large" />
                    <HexagramLines lines={displayResult.huGua.lines} label={`互卦：${displayResult.huGua.name}`} size="large" />
                    <HexagramLines lines={displayResult.bianGua.lines} label={`变卦：${displayResult.bianGua.name}`} size="large" />
                  </div>
                  <div className="text-center text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg p-4">
                    <p><span className="font-bold">本卦：</span>{displayResult.benGua.name} — {displayResult.benGua.meaning}</p>
                    <p><span className="font-bold">互卦：</span>{displayResult.huGua.name} — {displayResult.huGua.meaning}</p>
                    <p><span className="font-bold">变卦：</span>{displayResult.bianGua.name} — {displayResult.bianGua.meaning}</p>
                  </div>
                </div>

                {/* 上下卦信息 */}
                <div className="card">
                  <h2 className="card-title">卦象分析</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-gradient-to-b from-blue-50 to-white rounded-lg border border-blue-200">
                      <div className="text-5xl mb-3">{displayResult.upperGua.symbol}</div>
                      <div className="font-bold text-xl">{displayResult.upperGua.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{displayResult.upperGua.nature} · {displayResult.upperGua.element}</div>
                      <div className="text-xs text-blue-600 mt-2 bg-blue-100 rounded-full px-3 py-0.5 inline-block">上卦</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-b from-green-50 to-white rounded-lg border border-green-200">
                      <div className="text-5xl mb-3">{displayResult.lowerGua.symbol}</div>
                      <div className="font-bold text-xl">{displayResult.lowerGua.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{displayResult.lowerGua.nature} · {displayResult.lowerGua.element}</div>
                      <div className="text-xs text-green-600 mt-2 bg-green-100 rounded-full px-3 py-0.5 inline-block">下卦</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-500">动爻：</span>
                    <span className="font-bold text-red-700 text-lg">第 {displayResult.dongYao} 爻</span>
                    <span className="text-xs text-gray-400 ml-2">（{methodLabels[displayResult.method as MethodType] || displayResult.method}起卦）</span>
                  </div>
                </div>

                {/* 体用关系 */}
                <div className="card">
                  <h2 className="card-title">体用关系</h2>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xs text-gray-500 mb-1">体卦</div>
                      <div className="text-xl font-bold text-blue-700">{displayResult.tiYong.ti}</div>
                    </div>
                    <div className={`p-4 rounded-lg border ${getLevelColor(displayResult.tiYong.relation)}`}>
                      <div className="text-xs text-gray-500 mb-1">关系</div>
                      <div className="text-lg font-bold">{displayResult.tiYong.relation}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-xs text-gray-500 mb-1">用卦</div>
                      <div className="text-xl font-bold text-green-700">{displayResult.tiYong.yong}</div>
                    </div>
                  </div>
                </div>

                {/* 打印按钮 — 右上角独立位置 */}
              {interpretData && (
                <div className="flex justify-end">
                  <button
                    onClick={handlePrint}
                    className="no-print px-5 py-2.5 bg-white border-2 border-red-500 text-red-600 font-bold rounded-xl hover:bg-red-50 transition flex items-center gap-2 text-sm shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    打印报告
                  </button>
                </div>
              )}

                {/* 功能切换 */}
                <div className="tab-nav">
                  <button onClick={() => setShowInterpretation(true)}
                    className={`tab-btn ${showInterpretation ? 'active' : ''}`}>
                    详细解析
                  </button>
                  <button onClick={() => setShowInterpretation(false)}
                    className={`tab-btn ${!showInterpretation ? 'active' : ''}`}>
                    纯卦象
                  </button>
                </div>

                {/* 详细解析 */}
                {showInterpretation && interpretData && interpretation && (
                  <div className="space-y-6">
                    {/* 吉凶等级 */}
                    {interpretation.tiyongDetail && (
                      <div className={`card border-2 ${getLevelColor(interpretation.tiyongDetail.level)}`}>
                        <div className="text-center">
                          <div className="text-sm text-gray-500 mb-1">综合吉凶</div>
                          <div className="text-3xl font-bold mb-2">{interpretation.tiyongDetail.level}</div>
                          <p className="text-sm">{interpretation.tiyongDetail.description}</p>
                          <div className="mt-3 p-3 bg-white/50 rounded-lg">
                            <p className="text-sm font-medium">{interpretation.tiyongDetail.advice}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 动爻解析 */}
                    {interpretation.dongYaoData && (
                      <div className="card border-2 border-orange-200 bg-orange-50/30">
                        <h2 className="card-title chinese-red">动爻解析：第{displayResult.dongYao}爻</h2>
                        <div className="p-4 bg-white rounded-lg border border-orange-200 mb-3">
                          <p className="text-sm text-gray-800 leading-relaxed font-medium">{interpretation.dongYaoData.yaoCi}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                          <p className="text-sm text-blue-800"><span className="font-bold">象曰：</span>{interpretation.dongYaoData.xiangYue}</p>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{interpretation.dongYaoData.meaning}</p>
                      </div>
                    )}

                    {/* 本卦详解 */}
                    {interpretation.benDetail && (
                      <div className="card">
                        <h2 className="card-title">本卦详解：{displayResult.benGua.name}</h2>
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-3">
                          <p className="text-sm text-gray-800"><span className="font-bold">卦辞：</span>{interpretation.benDetail.guaCi}</p>
                        </div>
                        {interpretation.benDetail.xiangYue && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                            <p className="text-sm text-blue-800"><span className="font-bold">象曰：</span>{interpretation.benDetail.xiangYue}</p>
                          </div>
                        )}
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed">{interpretation.benDetail.summary}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { icon: '💼', title: '事业', content: interpretation.benDetail.career, bg: 'bg-blue-50 border-blue-200' },
                            { icon: '💰', title: '财运', content: interpretation.benDetail.wealth, bg: 'bg-yellow-50 border-yellow-200' },
                            { icon: '❤️', title: '感情', content: interpretation.benDetail.love, bg: 'bg-pink-50 border-pink-200' },
                            { icon: '🏥', title: '健康', content: interpretation.benDetail.health, bg: 'bg-green-50 border-green-200' },
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
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-700"><span className="font-bold">建议：</span>{interpretation.benDetail.advice}</p>
                        </div>
                      </div>
                    )}

                    {/* 变卦详解 */}
                    {interpretation.bianDetail && displayResult.bianGua.name !== displayResult.benGua.name && (
                      <div className="card">
                        <h2 className="card-title">变卦详解：{displayResult.bianGua.name}</h2>
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-3">
                          <p className="text-sm text-gray-800"><span className="font-bold">卦辞：</span>{interpretation.bianDetail.guaCi}</p>
                        </div>
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed">{interpretation.bianDetail.summary}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { icon: '💼', title: '事业', content: interpretation.bianDetail.career, bg: 'bg-blue-50 border-blue-200' },
                            { icon: '💰', title: '财运', content: interpretation.bianDetail.wealth, bg: 'bg-yellow-50 border-yellow-200' },
                            { icon: '❤️', title: '感情', content: interpretation.bianDetail.love, bg: 'bg-pink-50 border-pink-200' },
                            { icon: '🏥', title: '健康', content: interpretation.bianDetail.health, bg: 'bg-green-50 border-green-200' },
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
                      </div>
                    )}

                    {/* 综合总结 */}
                    <div className="card bg-gradient-to-br from-red-50 via-white to-yellow-50 border-red-200">
                      <h2 className="card-title chinese-red">综合判断</h2>
                      <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                        {interpretation.summary}
                      </div>
                    </div>

                    {/* ===== 深度解读区块 ===== */}

                    {/* 体用深度分析 */}
                    {detailedAnalysis?.tiYongAnalysis && (
                      <div className="card border-2 border-blue-200 bg-blue-50/30">
                        <h2 className="card-title text-blue-800">体用深度分析</h2>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 bg-white rounded-lg border border-blue-200 text-center">
                            <div className="text-xs text-gray-500 mb-1">体卦旺衰</div>
                            <div className="text-lg font-bold text-blue-700">{detailedAnalysis.tiYongAnalysis.tiWangshuai}</div>
                            <div className="text-xs text-gray-500 mt-1">{detailedAnalysis.tiYongAnalysis.tiElement}行</div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-green-200 text-center">
                            <div className="text-xs text-gray-500 mb-1">用卦旺衰</div>
                            <div className="text-lg font-bold text-green-700">{detailedAnalysis.tiYongAnalysis.yongWangshuai}</div>
                            <div className="text-xs text-gray-500 mt-1">{detailedAnalysis.tiYongAnalysis.yongElement}行</div>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg border ${getLevelColor(detailedAnalysis.tiYongAnalysis.level)} mb-3 text-center`}>
                          <span className="font-bold">综合等级：{detailedAnalysis.tiYongAnalysis.level}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-3">{detailedAnalysis.tiYongAnalysis.description}</p>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800 font-medium">建议：{detailedAnalysis.tiYongAnalysis.advice}</p>
                        </div>
                      </div>
                    )}

                    {/* 互卦与变卦影响 */}
                    {detailedAnalysis?.tiYongAnalysis && (
                      <div className="card">
                        <h2 className="card-title">互卦与变卦影响</h2>
                        <div className="space-y-3">
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-sm font-bold text-gray-700 mb-1">互卦影响（发展过程）</div>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{detailedAnalysis.tiYongAnalysis.huGuaInfluence}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-sm font-bold text-gray-700 mb-1">变卦影响（最终结局）</div>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{detailedAnalysis.tiYongAnalysis.bianGuaInfluence}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 卦象演变分析 */}
                    {detailedAnalysis?.guaEvolution && (
                      <div className="card border-2 border-purple-200 bg-purple-50/30">
                        <h2 className="card-title text-purple-800">卦象演变分析</h2>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="p-3 bg-white rounded-lg border border-purple-200 text-center">
                            <div className="text-xs text-gray-500 mb-1">本卦（起因）</div>
                            <div className="font-bold text-purple-700">{detailedAnalysis.guaEvolution.benGua.name}</div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-blue-200 text-center">
                            <div className="text-xs text-gray-500 mb-1">互卦（过程）</div>
                            <div className="font-bold text-blue-700">{detailedAnalysis.guaEvolution.huGua.name}</div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-green-200 text-center">
                            <div className="text-xs text-gray-500 mb-1">变卦（结局）</div>
                            <div className="font-bold text-green-700">{detailedAnalysis.guaEvolution.bianGua.name}</div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{detailedAnalysis.guaEvolution.evolution}</p>
                      </div>
                    )}

                    {/* 应期推断 */}
                    {detailedAnalysis?.timing && (
                      <div className="card border-2 border-orange-200 bg-orange-50/30">
                        <h2 className="card-title text-orange-800">应期推断</h2>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{detailedAnalysis.timing}</p>
                      </div>
                    )}

                    {/* 分领域断语 */}
                    {detailedAnalysis?.domainAnalysis && (
                      <div className="card">
                        <h2 className="card-title">分领域断语</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { icon: '事业', content: detailedAnalysis.domainAnalysis.career, bg: 'bg-blue-50 border-blue-200', title: 'text-blue-700' },
                            { icon: '财运', content: detailedAnalysis.domainAnalysis.wealth, bg: 'bg-yellow-50 border-yellow-200', title: 'text-yellow-700' },
                            { icon: '婚姻', content: detailedAnalysis.domainAnalysis.marriage, bg: 'bg-pink-50 border-pink-200', title: 'text-pink-700' },
                            { icon: '健康', content: detailedAnalysis.domainAnalysis.health, bg: 'bg-green-50 border-green-200', title: 'text-green-700' },
                            { icon: '考试', content: detailedAnalysis.domainAnalysis.exam, bg: 'bg-purple-50 border-purple-200', title: 'text-purple-700' },
                          ].map((item) => (
                            <div key={item.icon} className={`p-3 rounded-lg border ${item.bg}`}>
                              <div className={`font-bold text-sm ${item.title} mb-1`}>{item.icon}</div>
                              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{item.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 断卦六步法 */}
                    {detailedAnalysis?.divinationSteps && detailedAnalysis.divinationSteps.length > 0 && (
                      <div className="card bg-gradient-to-br from-gray-50 to-white border-gray-300">
                        <h2 className="card-title">断卦六步法（邵雍传统）</h2>
                        <div className="space-y-3">
                          {detailedAnalysis.divinationSteps.map((step: string, i: number) => (
                            <div key={i} className="p-3 bg-white rounded-lg border border-gray-200">
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 深度综合总结 */}
                    {detailedAnalysis?.overallSummary && (
                      <div className="card bg-gradient-to-br from-red-50 via-amber-50 to-yellow-50 border-2 border-red-200">
                        <h2 className="card-title chinese-red">深度综合总结</h2>
                        <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {detailedAnalysis.overallSummary}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== 打印视图 ===== */}
            {isPrinting && displayResult && (
              <div className="print-only print-container">
                <h1 className="print-title">梅花易数卦象分析报告</h1>
                <p style={{textAlign:'center', color:'#666', marginBottom:'6mm', fontSize:'10pt'}}>
                  生成时间：{new Date().toLocaleString('zh-CN')} | 知微阁 · 传承经典
                </p>

                <h2 className="print-section-title">一、起卦信息</h2>
                <div className="print-card">
                  <table className="print-table">
                    <tbody>
                      <tr><td style={{fontWeight:600}}>本卦</td><td>{displayResult.benGua.name}</td></tr>
                      <tr><td style={{fontWeight:600}}>互卦</td><td>{displayResult.huGua.name}</td></tr>
                      <tr><td style={{fontWeight:600}}>变卦</td><td>{displayResult.bianGua.name}</td></tr>
                      <tr><td style={{fontWeight:600}}>体卦</td><td>{displayResult.tiYong.ti}</td></tr>
                      <tr><td style={{fontWeight:600}}>用卦</td><td>{displayResult.tiYong.yong}</td></tr>
                      <tr><td style={{fontWeight:600}}>体用关系</td><td>{displayResult.tiYong.relation}</td></tr>
                    </tbody>
                  </table>
                </div>

                {interpretData && interpretation && (
                  <>
                    <h2 className="print-section-title print-page-break">二、卦象详细解析</h2>
                    {interpretation.tiyongDetail && (
                      <div className="print-card">
                        <h3 style={{fontSize:'12pt',fontWeight:600}}>综合吉凶：{interpretation.tiyongDetail.level}</h3>
                        <p>{interpretation.tiyongDetail.description}</p>
                        <p style={{fontStyle:'italic'}}>{interpretation.tiyongDetail.advice}</p>
                      </div>
                    )}
                    {interpretation.dongYaoData && (
                      <div className="print-card">
                        <h3 style={{fontSize:'12pt',fontWeight:600}}>动爻解析：第{displayResult.dongYao}爻</h3>
                        <p style={{fontWeight:600}}>爻辞：{interpretation.dongYaoData.yaoCi}</p>
                        <p>象曰：{interpretation.dongYaoData.xiangYue}</p>
                        <p>{interpretation.dongYaoData.meaning}</p>
                      </div>
                    )}
                    {interpretation.benDetail && (
                      <div className="print-card">
                        <h3 style={{fontSize:'12pt',fontWeight:600}}>本卦详解：{displayResult.benGua.name}</h3>
                        <p style={{fontWeight:600}}>卦辞：{interpretation.benDetail.guaCi}</p>
                        {interpretation.benDetail.xiangYue && <p>象曰：{interpretation.benDetail.xiangYue}</p>}
                        <p>{interpretation.benDetail.summary}</p>
                      </div>
                    )}
                  </>
                )}

                <div className="print-footer">
                  知微阁 ZHIWEI · 梅花易数卦象分析报告 · 仅供传统文化研究参考
                </div>
              </div>
            )}

            <Disclaimer />

                {/* 查看详细解读按钮 */}
                {!interpretData && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-red-600 to-amber-500 p-[2px] shadow-xl">
                    <div className="bg-white rounded-2xl px-6 py-5 text-center">
                      <div className="text-3xl mb-2">📖</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">查看梅花易数详细解读</h3>
                      <p className="text-sm text-gray-500 mb-4">解锁吉凶等级、动爻解析、体用深度分析、应期推断等深度内容</p>
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
                moduleLabel="梅花易数"
                onConfirmPay={() => handleInterpret(true)}
                onClose={() => setPaywall(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
