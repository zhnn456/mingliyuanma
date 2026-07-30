'use client';

import { useState } from 'react';
import { PaipanForm } from '@/components/PaipanForm';
import type { PaipanFormData, BaziResult, BaziDetailedAnalysis } from '@/types';
import { AIInterpretationResult } from '@/lib/interpretation/bazi-ai';

// ===================================================================
// 对比 Demo 页面 v2
// 左侧：规则引擎 11 维度 | 右侧：AI 技能增强 11 维度 + 总断/点醒句
// 同结构逐字段对比，差异一目了然
// ===================================================================

interface CompareResponse {
  ruleEngine: {
    result: BaziResult;
    xiYongShen: { xi: string; yong: string; ji: string };
  };
  aiEngine: AIInterpretationResult;
  meta: {
    dataLevel: string;
    aiSource: string;
    aiModel: string;
  };
}

export default function DemoComparePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<CompareResponse | null>(null);

  const handleSubmit = async (formData: PaipanFormData) => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch('/api/demo/ai-bazi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.error) setError(json.error);
      else setData(json);
    } catch {
      setError('请求失败，请检查网络或后端服务');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-kai font-bold" style={{ color: 'var(--color-primary)' }}>
            八字解读对比 Demo
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-ink-light)' }}>
            规则模板引擎 vs fortune-master-pro AI 技能增强 · 同一排盘数据，11 维度逐字段对比
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs"
            style={{ backgroundColor: 'rgba(200,164,92,0.15)', color: 'var(--color-gold-dark)' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            纯新增文件 · 未修改任何原有代码
          </div>
        </div>

        {!data && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 rounded-lg shadow-sm p-6" style={{ border: '1px solid rgba(200,164,92,0.3)' }}>
              <PaipanForm onSubmit={handleSubmit} loading={loading} title="排盘信息" submitText="生成对比报告" />
              {error && (
                <div className="mt-4 p-3 rounded text-sm text-center" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {data && (
          <>
            <div className="mb-4">
              <button onClick={() => setData(null)}
                className="text-sm px-4 py-2 rounded-lg transition-colors"
                style={{ border: '1px solid var(--color-gold)', color: 'var(--color-gold-dark)' }}>
                ← 重新排盘
              </button>
            </div>

            <ChartOverview result={data.ruleEngine.result} xiYongShen={data.ruleEngine.xiYongShen} />

            <div className="my-4 flex items-center gap-3 text-xs flex-wrap">
              <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(200,164,92,0.15)' }}>
                资料级别：{data.meta.dataLevel}
              </span>
              <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(45,140,60,0.1)' }}>
                AI 来源：{data.meta.aiSource === 'fallback' ? '示例数据（未配置 API Key）' : data.meta.aiModel}
              </span>
              {data.meta.aiSource === 'fallback' && (
                <span className="px-2 py-1 rounded" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                  配置 AI_API_KEY 后将调用真实大模型
                </span>
              )}
            </div>

            {/* 左右对比 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RuleEnginePanel result={data.ruleEngine.result} />
              <AIEnginePanel aiResult={data.aiEngine} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ===================================================================
// 排盘概览
// ===================================================================
function ChartOverview({ result, xiYongShen }: { result: BaziResult; xiYongShen: { xi: string; yong: string; ji: string } }) {
  const pillars = [
    { label: '年柱', gan: result.fourPillars.year.gan, zhi: result.fourPillars.year.zhi },
    { label: '月柱', gan: result.fourPillars.month.gan, zhi: result.fourPillars.month.zhi },
    { label: '日柱', gan: result.fourPillars.day.gan, zhi: result.fourPillars.day.zhi },
    { label: '时柱', gan: result.fourPillars.hour.gan || '—', zhi: result.fourPillars.hour.zhi || '—' },
  ];
  const wxColors: Record<string, string> = { '金': '#C8A45C', '木': '#2D8C3C', '水': '#1A5276', '火': '#B91C1C', '土': '#8B6914' };
  const ganElement = (gan: string) => ({ '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' })[gan] || '';
  const zhiElement = (zhi: string) => ({ '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' })[zhi] || '';

  return (
    <div className="bg-white/90 rounded-lg p-4 mb-4" style={{ border: '1px solid rgba(200,164,92,0.3)' }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-3">
          {pillars.map(p => (
            <div key={p.label} className="text-center">
              <div className="text-xs" style={{ color: 'var(--color-ink-light)' }}>{p.label}</div>
              <div className="flex gap-1 mt-1">
                <span className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold"
                  style={{ backgroundColor: wxColors[ganElement(p.gan)] + '20', color: wxColors[ganElement(p.gan)] }}>{p.gan}</span>
                <span className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold"
                  style={{ backgroundColor: wxColors[zhiElement(p.zhi)] + '20', color: wxColors[zhiElement(p.zhi)] }}>{p.zhi}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(45,140,60,0.1)' }}>喜：{xiYongShen.xi}</span>
          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(200,164,92,0.15)' }}>用：{xiYongShen.yong}</span>
          <span className="px-2 py-1 rounded" style={{ backgroundColor: 'rgba(185,28,28,0.1)' }}>忌：{xiYongShen.ji}</span>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// 通用：字段行
// ===================================================================
function FieldRow({ label, value }: { label: string; value: string | string[] }) {
  const display = Array.isArray(value) ? value.join('、') : value;
  return (
    <div className="flex gap-2 text-xs mb-1.5">
      <span className="flex-shrink-0 w-16 text-right opacity-60">{label}：</span>
      <span className="flex-1 whitespace-pre-line">{display || '—'}</span>
    </div>
  );
}

// 维度标题
function SectionTitle({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h4 className="font-kai text-sm font-bold mb-2 pb-1" style={{ color, borderBottom: `1px dashed ${color}33` }}>
      {children}
    </h4>
  );
}

// 通用：11 维度渲染器
function DimensionSections({ da }: { da: BaziDetailedAnalysis }) {
  return (
    <>
      {/* 1. 事业 */}
      <div className="mb-4">
        <SectionTitle color="var(--color-primary)">1. 事业分析</SectionTitle>
        <FieldRow label="方向" value={da.career.direction} />
        <FieldRow label="适合行业" value={da.career.suitableIndustries} />
        <FieldRow label="职业性格" value={da.career.careerCharacter} />
        <FieldRow label="发展时机" value={da.career.developmentTiming} />
        <FieldRow label="高峰期" value={da.career.peakPeriod} />
        <FieldRow label="建议" value={da.career.advice} />
      </div>

      {/* 2. 财运 */}
      <div className="mb-4">
        <SectionTitle color="var(--color-primary)">2. 财运分析</SectionTitle>
        <FieldRow label="类型" value={da.wealth.type} />
        <FieldRow label="等级" value={da.wealth.level} />
        <FieldRow label="特征" value={da.wealth.characteristics} />
        <FieldRow label="高峰期" value={da.wealth.peakPeriod} />
        <FieldRow label="理财建议" value={da.wealth.investmentAdvice} />
        <FieldRow label="风险提示" value={da.wealth.riskWarning} />
      </div>

      {/* 3. 感情婚姻 */}
      <div className="mb-4">
        <SectionTitle color="var(--color-primary)">3. 感情婚姻</SectionTitle>
        <FieldRow label="配偶特征" value={da.marriage.spouseCharacter} />
        <FieldRow label="婚姻前景" value={da.marriage.marriageProspect} />
        <FieldRow label="桃花运势" value={da.marriage.romanticLuck} />
        <FieldRow label="有利年龄" value={da.marriage.favorableAge} />
        <FieldRow label="建议" value={da.marriage.advice} />
      </div>

      {/* 4. 健康 */}
      <div className="mb-4">
        <SectionTitle color="var(--color-primary)">4. 健康分析</SectionTitle>
        <FieldRow label="体质" value={da.health.constitution} />
        <FieldRow label="易患部位" value={da.health.weakOrgans} />
        <FieldRow label="健康风险" value={da.health.healthRisks} />
        <FieldRow label="养生建议" value={da.health.maintenanceAdvice} />
        <FieldRow label="饮食建议" value={da.health.dietaryAdvice} />
      </div>

      {/* 5. 学业 */}
      <div className="mb-4">
        <SectionTitle color="var(--color-primary)">5. 学业分析</SectionTitle>
        <FieldRow label="学习风格" value={da.education.learningStyle} />
        <FieldRow label="学业潜力" value={da.education.academicPotential} />
        <FieldRow label="有利学科" value={da.education.favorableSubjects} />
        <FieldRow label="考试运势" value={da.education.examLuck} />
        <FieldRow label="建议" value={da.education.advice} />
      </div>

      {/* 6. 六亲 */}
      <div className="mb-4">
        <SectionTitle color="var(--color-primary)">6. 六亲关系</SectionTitle>
        {da.family.relations.map((r, i) => (
          <div key={i} className="mb-2 pl-2 border-l-2" style={{ borderColor: 'rgba(200,164,92,0.3)' }}>
            <div className="text-xs font-bold mb-0.5">{r.relation}（{r.star}）</div>
            <FieldRow label="分析" value={r.analysis} />
            <FieldRow label="建议" value={r.advice} />
          </div>
        ))}
        <FieldRow label="综述" value={da.family.summary} />
      </div>

      {/* 7. 开运 */}
      <div className="mb-4">
        <SectionTitle color="var(--color-primary)">7. 开运建议</SectionTitle>
        <FieldRow label="幸运色" value={da.luck.luckyColors} />
        <FieldRow label="幸运方位" value={da.luck.luckyDirections} />
        <FieldRow label="幸运数字" value={da.luck.luckyNumbers} />
        <FieldRow label="幸运行业" value={da.luck.luckyIndustries} />
        <FieldRow label="开运物品" value={da.luck.luckyItems} />
        <FieldRow label="风水建议" value={da.luck.fengShuiAdvice} />
        <FieldRow label="日常建议" value={da.luck.dailyAdvice} />
      </div>

      {/* 8. 性格 */}
      <div className="mb-4">
        <SectionTitle color="var(--color-primary)">8. 性格深度</SectionTitle>
        <FieldRow label="核心性格" value={da.personality.core} />
        <FieldRow label="优势" value={da.personality.strengths} />
        <FieldRow label="弱势" value={da.personality.weaknesses} />
        <FieldRow label="社交风格" value={da.personality.socialStyle} />
        <FieldRow label="情感模式" value={da.personality.emotionalStyle} />
        <FieldRow label="思维模式" value={da.personality.thinkingStyle} />
        <FieldRow label="成长建议" value={da.personality.growthAdvice} />
      </div>

      {/* 9. 一生综述 */}
      <div className="mb-4">
        <SectionTitle color="var(--color-primary)">9. 一生综述</SectionTitle>
        <FieldRow label="总体" value={da.lifeOverview.summary} />
        {da.lifeOverview.stages.map((s, i) => (
          <FieldRow key={i} label={s.period} value={s.description} />
        ))}
        <FieldRow label="关键建议" value={da.lifeOverview.keyAdvice} />
      </div>

      {/* 10. 大运详解 */}
      {da.dayunInterpretations.length > 0 && (
        <div className="mb-4">
          <SectionTitle color="var(--color-primary)">10. 大运详解</SectionTitle>
          {da.dayunInterpretations.map((dy, i) => (
            <FieldRow key={i} label={`第${dy.dayunIndex + 1}步`} value={dy.analysis} />
          ))}
        </div>
      )}

      {/* 11. 流年详解 */}
      {da.liunianInterpretations.length > 0 && (
        <div className="mb-4">
          <SectionTitle color="var(--color-primary)">11. 流年详解</SectionTitle>
          {da.liunianInterpretations.map((ln, i) => (
            <FieldRow key={i} label={`${ln.year}年`} value={ln.analysis} />
          ))}
        </div>
      )}
    </>
  );
}

// ===================================================================
// 规则引擎面板（左）
// ===================================================================
function RuleEnginePanel({ result }: { result: BaziResult }) {
  const da = result.detailedAnalysis;
  if (!da) return <div className="p-4">无详细分析数据</div>;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(200,164,92,0.4)' }}>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          <span className="font-kai text-base">规则模板引擎</span>
        </div>
        <span className="text-xs opacity-60">现有方案 · 11 维度</span>
      </div>
      <div className="bg-white/80 p-4 max-h-[800px] overflow-y-auto">
        <div className="mb-3 p-2 rounded text-xs" style={{ backgroundColor: '#f0f9ff', color: '#1e40af' }}>
          硬编码查找表 + if/else 逻辑 + 字符串拼接。每个字段独立查表，字段间无串联逻辑。
        </div>
        <DimensionSections da={da} />
      </div>
    </div>
  );
}

// ===================================================================
// AI 技能面板（右）
// ===================================================================
function AIEnginePanel({ aiResult }: { aiResult: AIInterpretationResult }) {
  const da = aiResult.detailedAnalysis;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(185,28,28,0.4)' }}>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-paper)' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="font-kai text-base">AI 技能增强</span>
        </div>
        <span className="text-xs opacity-80">
          {aiResult.source === 'fallback' ? '示例数据' : aiResult.model} · 11 维度 + 综合层
        </span>
      </div>
      <div className="bg-white/80 p-4 max-h-[800px] overflow-y-auto">
        <div className="mb-3 p-2 rounded text-xs" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
          fortune-master-pro 技能框架 → 大模型生成。有总断气韵、字段间串联逻辑、阶段判断、点醒句。
        </div>

        {/* 标题 */}
        <h3 className="font-kai text-base font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
          {aiResult.title}
        </h3>

        {/* 总断（AI 独有） */}
        {aiResult.totalJudgment && (
          <div className="mb-3 p-3 rounded" style={{ backgroundColor: 'rgba(185,28,28,0.05)', borderLeft: '3px solid var(--color-primary)' }}>
            <div className="text-xs font-bold mb-1" style={{ color: 'var(--color-primary)' }}>总断</div>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#374151' }}>
              {aiResult.totalJudgment}
            </p>
          </div>
        )}

        {/* 11 维度（同结构） */}
        <DimensionSections da={da} />

        {/* 点醒句（AI 独有） */}
        {aiResult.closingRemark && (
          <div className="mt-4 p-3 rounded" style={{ backgroundColor: 'rgba(200,164,92,0.1)', borderTop: '2px solid var(--color-gold)' }}>
            <div className="text-xs font-bold mb-1" style={{ color: 'var(--color-gold-dark)' }}>点醒句</div>
            <p className="text-sm leading-relaxed italic" style={{ color: '#374151' }}>
              {aiResult.closingRemark}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
