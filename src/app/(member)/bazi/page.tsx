'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { BaziResult } from '@/types';
import { BaziForm } from '@/components/bazi/BaziForm';
import { PaipanForm } from '@/components/PaipanForm';
import { BaziChart } from '@/components/bazi/BaziChart';
import { WuxingAnalysis } from '@/components/bazi/WuxingAnalysis';
import { DayunDisplay } from '@/components/bazi/DayunDisplay';
import { BaziInterpretation } from '@/components/bazi/BaziInterpretation';
import { useToast } from '@/components/Toast';

interface XiYongShen {
  xi: string;
  yong: string;
  ji: string;
}

export default function BaziPage() {
  const { data: session } = useSession();
  const [result, setResult] = useState<BaziResult | null>(null);
  const [xiYongShen, setXiYongShen] = useState<XiYongShen | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInterpretation, setShowInterpretation] = useState(true);
  const { addToast } = useToast();
  const [initialLoaded, setInitialLoaded] = useState(false);

  // 页面加载时获取上次结果
  useEffect(() => {
    if (session && !initialLoaded) {
      setInitialLoaded(true);
      fetch('/api/user/latest?type=bazi')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.record?.result) {
            setResult(data.record.result);
            if (data.record.xiYongShen) {
              setXiYongShen(data.record.xiYongShen);
            }
          }
        })
        .catch(() => {});
    }
  }, [session, initialLoaded]);

  const handleSubmit = async (data: {
    year: number;
    month: number;
    day: number;
    hour: number;
    gender: string;
    isLunar: boolean;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bazi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || '排盘失败');

      setResult(json.result);
      setXiYongShen(json.xiYongShen);
      setShowInterpretation(true);
      addToast('success', '八字排盘完成！');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '排盘失败，请重试';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">四柱八字排盘</h1>
          <p className="text-gray-600">
            请输入您的出生信息，系统将为您推算八字命盘并提供详细命理解析
          </p>
        </div>

        {/* 输入表单 */}
        <div className="card mb-8">
          <PaipanForm
            onSubmit={handleSubmit}
            loading={loading}
            submitText="开始排盘"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 排盘结果 */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* 功能切换 */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowInterpretation(true)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${showInterpretation ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                详细解析
              </button>
              <button
                onClick={() => setShowInterpretation(false)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${!showInterpretation ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                纯命盘
              </button>
            </div>

            {/* 八字命盘 */}
            <BaziChart result={result} />

            {/* 五行分析 */}
            <WuxingAnalysis wuxing={result.wuxing} xiYongShen={xiYongShen} />

            {/* 大运 */}
            <DayunDisplay dayun={result.dayun} dayGan={result.fourPillars.day.gan} />

            {/* 详细命理解析 */}
            {showInterpretation && xiYongShen && (
              <BaziInterpretation
                dayGan={result.fourPillars.day.gan}
                wuxing={result.wuxing}
                xiYongShen={xiYongShen}
                nayin={result.nayin}
                shengxiao={result.shengxiao}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
