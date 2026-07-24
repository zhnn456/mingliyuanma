'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { generateMeihuaInterpretation } from '@/lib/interpretation/meihua';
import { HexagramLookup } from '@/components/HexagramLookup';
import { useToast } from '@/components/Toast';

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

type MethodType = 'number' | 'time' | 'text' | 'coin' | 'random' | 'date';

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
  const { data: session } = useSession();
  const [result, setResult] = useState<MeihuaResult | null>(null);
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
  const { addToast } = useToast();
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    if (session && !initialLoaded) {
      setInitialLoaded(true);
      fetch('/api/user/latest?type=meihua')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.record?.result) {
            setResult(data.record.result);
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
      const body: any = { method };
      if (method === 'number') { body.num1 = num1; body.num2 = num2; body.num3 = num3; }
      else if (method === 'text') { body.text = text; }
      else if (method === 'coin') { body.flips = flips; }
      else if (method === 'date') { body.date = date; }

      const response = await fetch('/api/meihua', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || '起卦失败');
      setResult(json.result);
      setShowInterpretation(true);
      addToast('success', '起卦完成！');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '起卦失败';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const interpretation = result ? generateMeihuaInterpretation(result) : null;

  const getLevelColor = (level: string) => {
    if (level === '大吉') return 'bg-green-100 text-green-800 border-green-300';
    if (level === '小吉') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (level === '平') return 'bg-gray-100 text-gray-800 border-gray-300';
    if (level === '小凶') return 'bg-orange-100 text-orange-800 border-orange-300';
    if (level === '凶') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const methodLabels: Record<MethodType, string> = {
    number: '数字', time: '时间', text: '文字', coin: '硬币', random: '随机', date: '日期'
  };

  const handleRandomCoin = () => {
    setFlips(Array.from({ length: 6 }, () => Math.floor(Math.random() * 4)));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">梅花易数</h1>
          <p className="text-gray-600">选择起卦方式，获取卦象与详细解析</p>
        </div>

        {/* 主Tab切换 */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab('divination')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'divination' ? 'bg-red-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}
          >
            起卦占事
          </button>
          <button
            onClick={() => setActiveTab('lookup')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'lookup' ? 'bg-red-700 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}
          >
            64卦速查
          </button>
        </div>

        {activeTab === 'lookup' && (
          <div className="card">
            <h2 className="card-title text-center mb-4">六十四卦速查</h2>
            <HexagramLookup />
          </div>
        )}

        {activeTab === 'divination' && (
          <>
            {/* 输入表单 */}
            <div className="card mb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 起卦方式选择 */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {(['number', 'time', 'text', 'coin', 'random', 'date'] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setMethod(m)}
                      className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${method === m ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {methodLabels[m]}起卦
                    </button>
                  ))}
                </div>

                {/* 数字起卦 */}
                {method === 'number' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">上卦数</label>
                      <input type="number" value={num1} onChange={(e) => setNum1(e.target.value)} placeholder="第一个数" min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">下卦数</label>
                      <input type="number" value={num2} onChange={(e) => setNum2(e.target.value)} placeholder="第二个数" min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">动爻数</label>
                      <input type="number" value={num3} onChange={(e) => setNum3(e.target.value)} placeholder="第三个数" min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" required />
                    </div>
                  </div>
                )}

                {/* 文字起卦 */}
                {method === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">输入文字（至少2个字）</label>
                    <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="如：天地" minLength={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" required />
                  </div>
                )}

                {/* 硬币起卦 */}
                {method === 'coin' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">模拟掷6次硬币，每次3枚。正面数：0=全反(老阴)，1=二反一正(少阳)，2=一反二正(少阴)，3=全正(老阳)</p>
                    <div className="grid grid-cols-6 gap-2">
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
                            className="w-full px-1 py-2 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-red-500"
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
                      className="mx-auto block px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" required />
                  </div>
                )}

                {/* 时间起卦 */}
                {method === 'time' && <p className="text-gray-500 text-sm text-center">将使用当前时间起卦</p>}

                <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-lg disabled:opacity-50">
                  {loading ? '起卦中...' : '开始起卦'}
                </button>
              </form>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

            {result && (
              <div className="space-y-6 animate-fade-in">
                {/* 卦象展示 */}
                <div className="card">
                  <h2 className="card-title text-center">卦象</h2>
                  <div className="grid grid-cols-3 gap-8 mb-6">
                    <HexagramLines lines={result.benGua.lines} dongYao={result.dongYao} label={`本卦：${result.benGua.name}`} size="large" />
                    <HexagramLines lines={result.huGua.lines} label={`互卦：${result.huGua.name}`} size="large" />
                    <HexagramLines lines={result.bianGua.lines} label={`变卦：${result.bianGua.name}`} size="large" />
                  </div>
                  <div className="text-center text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg p-4">
                    <p><span className="font-bold">本卦：</span>{result.benGua.name} — {result.benGua.meaning}</p>
                    <p><span className="font-bold">互卦：</span>{result.huGua.name} — {result.huGua.meaning}</p>
                    <p><span className="font-bold">变卦：</span>{result.bianGua.name} — {result.bianGua.meaning}</p>
                  </div>
                </div>

                {/* 上下卦信息 */}
                <div className="card">
                  <h2 className="card-title">卦象分析</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-6 bg-gradient-to-b from-blue-50 to-white rounded-lg border border-blue-200">
                      <div className="text-5xl mb-3">{result.upperGua.symbol}</div>
                      <div className="font-bold text-xl">{result.upperGua.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{result.upperGua.nature} · {result.upperGua.element}</div>
                      <div className="text-xs text-blue-600 mt-2 bg-blue-100 rounded-full px-3 py-0.5 inline-block">上卦</div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-b from-green-50 to-white rounded-lg border border-green-200">
                      <div className="text-5xl mb-3">{result.lowerGua.symbol}</div>
                      <div className="font-bold text-xl">{result.lowerGua.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{result.lowerGua.nature} · {result.lowerGua.element}</div>
                      <div className="text-xs text-green-600 mt-2 bg-green-100 rounded-full px-3 py-0.5 inline-block">下卦</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-500">动爻：</span>
                    <span className="font-bold text-red-700 text-lg">第 {result.dongYao} 爻</span>
                    <span className="text-xs text-gray-400 ml-2">（{methodLabels[result.method as MethodType] || result.method}起卦）</span>
                  </div>
                </div>

                {/* 体用关系 */}
                <div className="card">
                  <h2 className="card-title">体用关系</h2>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xs text-gray-500 mb-1">体卦</div>
                      <div className="text-xl font-bold text-blue-700">{result.tiYong.ti}</div>
                    </div>
                    <div className={`p-4 rounded-lg border ${getLevelColor(result.tiYong.relation)}`}>
                      <div className="text-xs text-gray-500 mb-1">关系</div>
                      <div className="text-lg font-bold">{result.tiYong.relation}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-xs text-gray-500 mb-1">用卦</div>
                      <div className="text-xl font-bold text-green-700">{result.tiYong.yong}</div>
                    </div>
                  </div>
                </div>

                {/* 功能切换 */}
                <div className="flex justify-center gap-4">
                  <button onClick={() => setShowInterpretation(true)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${showInterpretation ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    详细解析
                  </button>
                  <button onClick={() => setShowInterpretation(false)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${!showInterpretation ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
                    纯卦象
                  </button>
                </div>

                {/* 详细解析 */}
                {showInterpretation && interpretation && (
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
                        <h2 className="card-title chinese-red">动爻解析：第{result.dongYao}爻</h2>
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
                        <h2 className="card-title">本卦详解：{result.benGua.name}</h2>
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
                    {interpretation.bianDetail && result.bianGua.name !== result.benGua.name && (
                      <div className="card">
                        <h2 className="card-title">变卦详解：{result.bianGua.name}</h2>
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
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
