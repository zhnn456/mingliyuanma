'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { PaipanForm } from '@/components/PaipanForm';
import { BaziChart } from '@/components/bazi/BaziChart';
import { BaziInterpretation } from '@/components/bazi/BaziInterpretation';
import { BaziProfessionalAnalysis } from '@/components/bazi/BaziProfessionalAnalysis';
import LifeKLineChart from '@/components/bazi/LifeKLineChart';
import { HePanForm } from '@/components/bazi/HePanForm';
import { HePanResult } from '@/components/bazi/HePanResult';
import { InterpretPaywall } from '@/components/InterpretPaywall';
import { useToast } from '@/components/Toast';
import { BaziResult } from '@/types';

export default function BaziPage() {
  const { user: session } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState<BaziResult | null>(null);
  const [interpretData, setInterpretData] = useState<{ result: BaziResult; xiYongShen: any } | null>(null);
  const [paywall, setPaywall] = useState<{ status: 401 | 402; cost?: number; balance?: number } | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [loadingInterpret, setLoadingInterpret] = useState(false);
  const [birthYear, setBirthYear] = useState<number>(0);
  const [tab, setTab] = useState<'chart'|'baihua'|'lunming'|'dayun'>('chart');
  const [isPrinting, setIsPrinting] = useState(false);

  // 合盘相关 state
  const [mainTab, setMainTab] = useState<'paipan'|'hepan'>('paipan');
  const [hepanResult, setHepanResult] = useState<any>(null);
  const [hepanBazi1, setHepanBazi1] = useState<any>(null);
  const [hepanBazi2, setHepanBazi2] = useState<any>(null);
  const [hepanLoading, setHepanLoading] = useState(false);
  const [hepanError, setHepanError] = useState('');

  const displayResult = interpretData?.result || chartData;
  const displayXiYongShen = interpretData?.xiYongShen;

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

  const handleSubmit = async (formInput: any) => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/bazi', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...formInput, mode: 'chart' }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error||'排盘失败');
      setChartData(j.result);
      setInterpretData(null);
      setPaywall(null);
      setFormData(formInput);
      if (formInput.year) setBirthYear(parseInt(formInput.year));
      addToast('success','排盘完成');
    } catch (e: any) { setError(e.message||'排盘失败'); addToast('error', e.message||'排盘失败'); }
    finally { setLoading(false); }
  };

  const handleInterpret = async (useLingzhu: boolean) => {
    if (!formData) return;
    setLoadingInterpret(true);
    try {
      const r = await fetch('/api/bazi', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...formData, mode: 'full', useLingzhu }) });
      const j = await r.json();
      if (r.status === 401) {
        setPaywall({ status: 401 });
      } else if (r.status === 402) {
        if (useLingzhu) {
          setPaywall(null);
          addToast('error', j.error || '积分不足，请充值');
        } else {
          const balance = await fetchBalance();
          setPaywall({ status: 402, cost: j.cost || 50, balance });
          if (j.result) setChartData(j.result);
        }
      } else if (!r.ok) {
        throw new Error(j.error || '解读失败');
      } else {
        setInterpretData({ result: j.result, xiYongShen: j.xiYongShen });
        setPaywall(null);
        addToast('success', '解读完成');
      }
    } catch (e: any) {
      setPaywall(null);
      setError(e.message || '解读失败');
      addToast('error', e.message || '解读失败');
    } finally {
      setLoadingInterpret(false);
    }
  };

  // 打印报告
  const handlePrint = () => {
    setIsPrinting(true);
    // 等待 React 渲染完成后再打印
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };
  const handleHePanSubmit = async (person1: any, person2: any) => {
    setHepanLoading(true); setHepanError('');
    try {
      const r = await fetch('/api/bazi/hepan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person1, person2 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || '合盘失败');
      setHepanResult(j.result);
      setHepanBazi1(j.bazi1);
      setHepanBazi2(j.bazi2);
      addToast('success', '合盘完成');
    } catch (e: any) {
      setHepanError(e.message || '合盘失败');
      addToast('error', e.message || '合盘失败');
    } finally {
      setHepanLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white">
      {/* 页面装饰背景 */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />

      <div className="relative z-10">
        {/* 页面标题 */}
        <div className="page-header">
          <div className="section-label justify-center">FOUR PILLARS OF DESTINY</div>
          <h1 className="page-header-title">
            <span>四柱八字排盘</span>
          </h1>
          <p className="page-header-subtitle">输入出生信息，排列天干地支，分析五行能量，提供传统文化视角的性格解读</p>
        </div>

        {/* 主Tab切换：排盘 / 合盘 */}
        <div className="tab-nav mb-10">
          <button
            onClick={() => setMainTab('paipan')}
            className={`tab-btn ${mainTab === 'paipan' ? 'active' : ''}`}
          >
            <span>☰</span>
            八字排盘
          </button>
          <button
            onClick={() => setMainTab('hepan')}
            className={`tab-btn ${mainTab === 'hepan' ? 'active' : ''}`}
          >
            <span>❤</span>
            姻缘合盘
          </button>
        </div>

        {/* ============ 八字排盘 ============ */}
        {mainTab === 'paipan' && (
          <>
            {/* 表单卡片 */}
            <div className="form-card mb-10">
              <PaipanForm onSubmit={handleSubmit} loading={loading} submitText="开始排盘" />
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2.5">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {(chartData || interpretData) && displayResult && (
              <div className="space-y-8 animate-fade-in">
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

                {/* Tab导航 */}
                <div className="tab-nav">
                  {[
                    { key:'chart' as const, label:'命盘总览', icon:'☰' },
                    { key:'baihua' as const, label:'白话解读', icon:'📖' },
                    { key:'lunming' as const, label:'论命版', icon:'📜' },
                    { key:'dayun' as const, label:'大运流年', icon:'📈' },
                  ].map(t => (
                    <button key={t.key} onClick={()=>setTab(t.key)}
                      className={`tab-btn ${tab===t.key?'active':''}`}>
                      <span>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>

                {tab === 'chart' && <BaziChart result={displayResult} />}
                {tab === 'baihua' && displayXiYongShen && (
                  <BaziInterpretation dayGan={displayResult.fourPillars.day.gan} wuxing={displayResult.wuxing}
                    xiYongShen={displayXiYongShen} nayin={displayResult.nayin} shengxiao={displayResult.shengxiao} />
                )}
                {tab === 'lunming' && displayXiYongShen && (
                  <BaziProfessionalAnalysis result={displayResult} xiYongShen={displayXiYongShen} />
                )}
                {tab === 'dayun' && birthYear > 0 && interpretData && (
                  <LifeKLineChart
                    dayun={displayResult.dayun}
                    xiYongShen={displayXiYongShen}
                    birthYear={birthYear}
                  />
                )}

                {/* 查看详细解读按钮 */}
                {!interpretData && (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-red-600 to-amber-500 p-[2px] shadow-xl">
                    <div className="bg-white rounded-2xl px-6 py-5 text-center">
                      <div className="text-3xl mb-2">📖</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">查看八字详细解读</h3>
                      <p className="text-sm text-gray-500 mb-4">解锁白话解读、论命版、大运流年等深度内容</p>
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

                {/* ===== 打印视图：所有 Tab 内容合并为一页 ===== */}
                {isPrinting && displayResult && (
                  <div className="print-only print-container">
                    <h1 className="print-title">八字命理分析报告</h1>
                    <p style={{textAlign:'center', color:'#666', marginBottom:'6mm', fontSize:'10pt'}}>
                      生成时间：{new Date().toLocaleString('zh-CN')} | 知微阁 · 传承经典
                    </p>

                    {/* 一、命盘总览 */}
                    <h2 className="print-section-title">一、命盘总览</h2>
                    <BaziChart result={displayResult} />

                    {/* 二、白话解读 */}
                    {displayXiYongShen && (
                      <>
                        <h2 className="print-section-title print-page-break">二、白话解读</h2>
                        <BaziInterpretation
                          dayGan={displayResult.fourPillars.day.gan}
                          wuxing={displayResult.wuxing}
                          xiYongShen={displayXiYongShen}
                          nayin={displayResult.nayin}
                          shengxiao={displayResult.shengxiao}
                        />
                      </>
                    )}

                    {/* 三、论命版 */}
                    {displayXiYongShen && (
                      <>
                        <h2 className="print-section-title print-page-break">三、专业论命分析</h2>
                        <BaziProfessionalAnalysis result={displayResult} xiYongShen={displayXiYongShen} />
                      </>
                    )}

                    {/* 四、大运流年 */}
                    {birthYear > 0 && interpretData && (
                      <>
                        <h2 className="print-section-title print-page-break">四、大运流年</h2>
                        <LifeKLineChart
                          dayun={displayResult.dayun}
                          xiYongShen={displayXiYongShen}
                          birthYear={birthYear}
                        />
                      </>
                    )}

                    <div className="print-footer">
                      知微阁 ZHIWEI · 八字命理分析报告 · 仅供传统文化研究参考
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ============ 姻缘合盘 ============ */}
        {mainTab === 'hepan' && (
          <>
            <div className="form-card mb-10">
              <HePanForm onSubmit={handleHePanSubmit} loading={hepanLoading} />
            </div>

            {hepanError && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2.5">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{hepanError}</span>
              </div>
            )}

            {hepanResult && (
              <HePanResult result={hepanResult} bazi1={hepanBazi1} bazi2={hepanBazi2} />
            )}
          </>
        )}

        {paywall && (
          <InterpretPaywall
            status={paywall.status}
            cost={paywall.cost}
            balance={paywall.balance}
            moduleLabel="八字"
            onConfirmPay={() => handleInterpret(true)}
            onClose={() => setPaywall(null)}
          />
        )}
      </div>
    </div>
  );
}


