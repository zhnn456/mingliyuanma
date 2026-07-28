'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PaipanForm } from '@/components/PaipanForm';
import { BaziChart } from '@/components/bazi/BaziChart';
import { BaziInterpretation } from '@/components/bazi/BaziInterpretation';
import { BaziProfessionalAnalysis } from '@/components/bazi/BaziProfessionalAnalysis';
import LifeKLineChart from '@/components/bazi/LifeKLineChart';
import { useToast } from '@/components/Toast';
import { BaziResult } from '@/types';

export default function BaziPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<{ result: BaziResult; xiYongShen: any } | null>(null);
  const [birthYear, setBirthYear] = useState<number>(0);
  const [tab, setTab] = useState<'chart'|'baihua'|'lunming'|'dayun'>('chart');

  const handleSubmit = async (formData: any) => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/bazi', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(formData) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error||'排盘失败');
      setData({ result: j.result, xiYongShen: j.xiYongShen });
      if (formData.year) setBirthYear(parseInt(formData.year));
      addToast('success','排盘完成');
    } catch (e: any) { setError(e.message||'排盘失败'); addToast('error', e.message||'排盘失败'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white">
      {/* 页面装饰背景 */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        {/* 页面标题 */}
        <div className="page-header">
          <div className="section-label justify-center">FOUR PILLARS OF DESTINY</div>
          <h1 className="page-header-title">
            <span>四柱八字排盘</span>
          </h1>
          <p className="page-header-subtitle">输入出生信息，推算天干地支，分析五行旺衰，解读命运密码</p>
        </div>

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

        {data && (
          <div className="space-y-8 animate-fade-in">
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

            {tab === 'chart' && <BaziChart result={data.result} />}
            {tab === 'baihua' && data.xiYongShen && (
              <BaziInterpretation dayGan={data.result.fourPillars.day.gan} wuxing={data.result.wuxing}
                xiYongShen={data.xiYongShen} nayin={data.result.nayin} shengxiao={data.result.shengxiao} />
            )}
            {tab === 'lunming' && data.xiYongShen && (
              <BaziProfessionalAnalysis result={data.result} xiYongShen={data.xiYongShen} />
            )}
            {tab === 'dayun' && birthYear > 0 && (
              <LifeKLineChart
                dayun={data.result.dayun}
                xiYongShen={data.xiYongShen}
                birthYear={birthYear}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}


