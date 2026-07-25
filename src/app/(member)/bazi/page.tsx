'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { PaipanForm } from '@/components/PaipanForm';
import { BaziChart } from '@/components/bazi/BaziChart';
import { BaziInterpretation } from '@/components/bazi/BaziInterpretation';
import { BaziProfessionalAnalysis } from '@/components/bazi/BaziProfessionalAnalysis';
import { useToast } from '@/components/Toast';
import { BaziResult, TIAN_GAN_WU_XING, DI_ZHI_WU_XING } from '@/types';
import { analyzeQiangRuo, getTiaoHou, analyzeRelations, ALL_SHEN_SHA } from '@/lib/interpretation/bazi-analysis';

const WXC = (w:string) => ({'金':'#c8a45c','木':'#2d8c3c','水':'#1a5276','火':'#b91c1c','土':'#8b6914'}[w]||'#666');

export default function BaziPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<{ result: BaziResult; xiYongShen: any } | null>(null);
  const [tab, setTab] = useState<'chart'|'baihua'|'lunming'|'dayun'|'report'>('chart');

  const handleSubmit = async (formData: any) => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/bazi', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(formData) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error||'排盘失败');
      setData({ result: j.result, xiYongShen: j.xiYongShen });
      addToast('success','排盘完成');
    } catch (e: any) { setError(e.message||'排盘失败'); addToast('error', e.message||'排盘失败'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs mb-3">🔮 传承经典 · 科学解读</div>
          <h1 className="text-3xl font-bold text-gray-900" style={{fontFamily:'serif'}}>四柱八字排盘</h1>
          <p className="text-gray-500 mt-2 text-sm">输入出生信息 · 获取完整命理分析</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-parchment-200 p-6 mb-8">
          <PaipanForm onSubmit={handleSubmit} loading={loading} submitText="开始排盘" />
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

        {data && (
          <div className="space-y-6 animate-fade-in">
            {/* Tab导航 */}
            <div className="flex flex-wrap justify-center gap-1.5 bg-white/80 rounded-2xl shadow-sm border border-parchment-200 p-1.5">
              {[
                { key:'chart' as const, label:'命盘总览', icon:'📊' },
                { key:'baihua' as const, label:'白话解读', icon:'📖' },
                { key:'lunming' as const, label:'论命版', icon:'📜' },
                { key:'dayun' as const, label:'大运流年', icon:'📈' },
                { key:'report' as const, label:'完整报告', icon:'📑' },
              ].map(t => (
                <button key={t.key} onClick={()=>setTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    tab===t.key ? 'bg-red-700 text-white shadow-md' : 'text-gray-600 hover:bg-parchment-100'
                  }`}>{t.icon} {t.label}</button>
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
            {tab === 'dayun' && <DayunLiunianTab result={data.result} xiYongShen={data.xiYongShen} />}
            {tab === 'report' && <ComprehensiveReport result={data.result} xiYongShen={data.xiYongShen} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 大运流年Tab =====
function DayunLiunianTab({ result, xiYongShen }: { result: BaziResult; xiYongShen: any }) {
  const { dayun } = result;
  const cy = new Date().getFullYear();
  const cg = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][(cy-4)%10];
  const cz = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(cy-4)%12];
  const TGWX: Record<string,string> = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  const DZWX: Record<string,string> = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-parchment-200 p-5">
        <h2 className="font-bold text-gray-800 text-lg mb-4" style={{fontFamily:'serif'}}>🎯 {cy}年流年运势</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center"><div className="text-xs text-blue-600">岁君</div><div className="text-lg font-bold">{cg}</div></div>
          <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-center"><div className="text-xs text-green-600">太岁</div><div className="text-lg font-bold">{cz}</div></div>
          <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-center"><div className="text-xs text-yellow-600">干支</div><div className="text-lg font-bold">{cg}{cz}</div></div>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center"><div className="text-xs text-purple-600">五行</div><div className="text-lg font-bold">{TGWX[cg]}{DZWX[cz]}</div></div>
        </div>
        {xiYongShen && <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm">
          {TGWX[cg]===xiYongShen.yong||DZWX[cz]===xiYongShen.yong ? <span className="text-green-700">✅ 流年得用神加持</span> : 
           TGWX[cg]===xiYongShen.ji||DZWX[cz]===xiYongShen.ji ? <span className="text-red-600">⚠️ 流年逢忌神，宜守</span> :
           <span className="text-gray-600">平顺之年</span>}
        </div>}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-parchment-200 p-5">
        <h2 className="font-bold text-gray-800 text-lg mb-4" style={{fontFamily:'serif'}}>📈 大运时间轴</h2>
        <div className="space-y-2">
          {dayun.map((dy,i) => {
            const gWx = TGWX[dy.gan], zWx = DZWX[dy.zhi];
            const isYong = xiYongShen && (gWx===xiYongShen.yong||zWx===xiYongShen.yong);
            const isJi = xiYongShen && (gWx===xiYongShen.ji||zWx===xiYongShen.ji);
            return <div key={i} className={`p-3 rounded-xl border flex items-center gap-4 ${isYong?'bg-green-50 border-green-200':isJi?'bg-red-50 border-red-200':'bg-gray-50 border-gray-200'}`}>
              <div className="text-center w-14"><div className="text-[10px] text-gray-500">第{i+1}步</div><div className="text-lg font-bold"><span style={{color:WXC(gWx)}}>{dy.gan}</span><span style={{color:WXC(zWx)}}>{dy.zhi}</span></div></div>
              <div className="flex-1"><div className="font-bold">{dy.startAge}-{dy.startAge+9}岁</div><div className="flex gap-1 text-xs text-gray-500 mt-0.5">{gWx}运 · {zWx}运</div></div>
              <span className={`text-xs px-2 py-1 rounded-lg ${isYong?'bg-green-200 text-green-800':isJi?'bg-red-200 text-red-800':'bg-gray-200 text-gray-600'}`}>{isYong?'吉':isJi?'凶':'平'}</span>
            </div>;
          })}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-parchment-200 p-5">
        <h2 className="font-bold text-gray-800 text-lg mb-4" style={{fontFamily:'serif'}}>🔮 未来流年速览</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({length:8}).map((_,i)=>{
            const y=cy+i, g=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][(y-4)%10], z=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(y-4)%12];
            return <div key={y} className={`p-3 rounded-xl border text-center ${i===0?'bg-red-50 border-red-300':'bg-white border-parchment-200'}`}>
              <div className={`text-xs ${i===0?'text-red-600':'text-gray-400'}`}>{y}</div>
              <div className="text-base font-bold my-0.5"><span style={{color:WXC(TGWX[g])}}>{g}</span><span style={{color:WXC(DZWX[z])}}>{z}</span></div>
              <div className="text-[10px] text-gray-400">{TGWX[g]}{DZWX[z]}</div>
              {i===0&&<div className="text-[10px] text-red-600 font-bold mt-0.5">今年</div>}
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ===== 完整报告Tab =====
function ComprehensiveReport({ result, xiYongShen }: { result: BaziResult; xiYongShen: any }) {
  const { fourPillars, wuxing, dayun, shishen, gender, shengxiao } = result;
  const dg = fourPillars.day.gan, dz = fourPillars.day.zhi;
  const mz = fourPillars.month.zhi, yz = fourPillars.year.zhi;
  const gans = [fourPillars.year.gan, fourPillars.month.gan, fourPillars.day.gan, fourPillars.hour.gan];
  const zhis = [fourPillars.year.zhi, fourPillars.month.zhi, fourPillars.day.zhi, fourPillars.hour.zhi];
  const ygz = fourPillars.year.gan + fourPillars.year.zhi;
  const month = ({寅:1,卯:2,辰:3,巳:4,午:5,未:6,申:7,酉:8,戌:9,亥:10,子:11,丑:12}[mz]||1);

  const qr = useMemo(() => analyzeQiangRuo(dg, mz, gans.map((g,i)=>g+zhis[i])), [dg,mz,gans,zhis]);
  const th = useMemo(() => getTiaoHou(dg, month), [dg,month]);
  const relations = useMemo(() => analyzeRelations(gans, zhis), [gans,zhis]);
  const shenSha = useMemo(() => {
    const s:[string,string[]][] = [];
    Object.entries(ALL_SHEN_SHA).forEach(([n,f]) => { const r = f(dg,yz,ygz,String(month)); if(r.length>0) s.push([n,r]); });
    return s;
  }, [dg,yz,ygz,month]);
  const sorted = Object.entries(wuxing).sort((a,b)=>b[1]-a[1]);
  const total = Object.values(wuxing).reduce((a,b)=>a+b,0);
  const dgWx = TIAN_GAN_WU_XING[dg];

  const report = useMemo(() => {
    const l: string[] = [];
    l.push(`【命格总论】日主${dg}属${dgWx}，生${mz}月。日主${qr.level}（得分${qr.score}）。`);
    if (th) l.push(`调候用神为「${th.need}」，${th.reason}。`);
    if (xiYongShen) l.push(`喜用神「${xiYongShen.xi}」，用神「${xiYongShen.yong}」，忌神「${xiYongShen.ji}」。`);
    const mx = sorted[0], mn = sorted[sorted.length-1];
    l.push(`五行${mx[0]}最旺（${Math.round(mx[1]/total*100)}%），`);
    if (mn[1]===0) l.push(`缺${mn[0]}。`);

    l.push(`\n【十神分析】`);
    ['年干','月干','时干'].forEach(k => { if (shishen[k]) l.push(`· ${k}${shishen[k]}：${({正官:'正直守序',七杀:'果敢魄力',正印:'慈爱学业',偏印:'独特思维',正财:'稳定财源',偏财:'慷慨商机',食神:'心宽艺高',伤官:'聪明创新',比肩:'独立自主',劫财:'好胜竞争'}[shishen[k]]||'')}`); });

    l.push(`\n【天干关系】`);
    const heGans = gans.filter((g,i) => i>0);
    const WUHE: Record<string,string> = {'甲己':'化土','乙庚':'化金','丙辛':'化水','丁壬':'化木','戊癸':'化火'};
    for (let i=0;i<gans.length;i++) for (let j=i+1;j<gans.length;j++) {
      const k = gans[i]+gans[j], r = gans[j]+gans[i];
      if (WUHE[k]) l.push(`· ${gans[i]}${gans[j]}五合${WUHE[k]}`);
      else if (WUHE[r]) l.push(`· ${gans[j]}${gans[i]}五合${WUHE[r]}`);
    }
    const CHONG: Record<string,string> = {'甲庚':'金木冲','乙辛':'金木冲','丙壬':'水火冲','丁癸':'水火冲'};
    for (let i=0;i<gans.length;i++) for (let j=i+1;j<gans.length;j++) {
      if (CHONG[gans[i]+gans[j]]) l.push(`· ${gans[i]}${gans[j]}天干相冲（${CHONG[gans[i]+gans[j]]}）`);
      else if (CHONG[gans[j]+gans[i]]) l.push(`· ${gans[j]}${gans[i]}天干相冲（${CHONG[gans[j]+gans[i]]}）`);
    }

    l.push(`\n【地支关系】`);
    relations.forEach(r => {
      if (r.items.length > 0) l.push(`· ${r.type}：${r.items.join('、')} — ${r.description}`);
    });

    l.push(`\n【神煞星运】`);
    shenSha.forEach(([n,v]) => l.push(`· ${n}${v.length>0?'（'+v.join('、')+'）':''}`));

    l.push(`\n【大运走势】`);
    dayun.forEach((dy,i) => {
      const gWx = TIAN_GAN_WU_XING[dy.gan], zWx = DI_ZHI_WU_XING[dy.zhi];
      const yq = xiYongShen && (gWx===xiYongShen.yong||zWx===xiYongShen.yong);
      const jq = xiYongShen && (gWx===xiYongShen.ji||zWx===xiYongShen.ji);
      l.push(`· ${dy.startAge}-${dy.startAge+9}岁：${dy.gan}${dy.zhi}（${gWx}${zWx}）${yq?'【吉运】':jq?'【凶运】':'【平运】'}`);
    });

    l.push(`\n【综合建议】`);
    l.push(`命局${qr.level}。`);
    if (qr.level.includes('强')) l.push('宜用官杀、食伤、财星以平衡。');
    else if (qr.level.includes('弱')) l.push('宜用印星、比劫以扶助。');
    else l.push('宜随大运调候，顺势而为。');
    if (xiYongShen) l.push(`日常生活中宜亲近「${xiYongShen.yong}」属性，避免「${xiYongShen.ji}」过度影响。`);
    l.push(`\n《渊海子平》云："命理之道，贵在知命而用。" 命运可参考，人生靠把握。`);

    return l.join('\n');
  }, [dg,dgWx,mz,qr,th,xiYongShen,sorted,total,shishen,gans,zhis,relations,shenSha,dayun]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-parchment-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📑</span>
        <h2 className="font-bold text-gray-800 text-lg" style={{fontFamily:'serif'}}>完整命理报告</h2>
      </div>
      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-[system-ui]">{report}</div>
      <div className="mt-6 pt-4 border-t border-parchment-200 flex justify-between items-center">
        <span className="text-xs text-gray-400">{gender==='male'?'乾造':'坤造'} · {dg}{dz}日主</span>
        <button onClick={() => { const b = new Blob([report], {type:'text/plain'}); const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`命理报告_${dg}${dz}.txt`; a.click(); }}
          className="text-xs px-3 py-1.5 bg-red-700 text-white rounded-lg hover:bg-red-800">📥 下载报告</button>
      </div>
    </div>
  );
}
