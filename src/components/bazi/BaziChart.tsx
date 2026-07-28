'use client';

import { BaziResult } from '@/types';

interface Props { result: BaziResult; }

const WX: Record<string,string> = {'金':'#d97706','木':'#059669','水':'#0284c7','火':'#dc2626','土':'#8b6914'};
const GWX: Record<string,string> = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
const ZWX: Record<string,string> = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
const CG: Record<string,string[]> = {'子':['癸'],'丑':['己','癸','辛'],'寅':['甲','丙','戊'],'卯':['乙'],'辰':['戊','乙','癸'],'巳':['丙','庚','戊'],'午':['丁','己'],'未':['己','丁','乙'],'申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],'亥':['壬','甲']};

export function BaziChart({ result }: Props) {
  const { fourPillars: fp, wuxing, dayun, gender } = result;
  const cy = new Date().getFullYear();
  const totalWx = Object.values(wuxing).reduce((a,b)=>a+b, 0);
  const sortedWx = Object.entries(wuxing).sort((a,b)=>b[1]-a[1]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 命盘卡片 */}
      <div className="card overflow-hidden">
        <div className="bg-gray-900 text-white -m-6 mb-0 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{gender==='male'?'乾造':'坤造'}{result.unknownHour ? ' · 三柱论命' : ''}</div>
            <div className="text-sm text-gray-400 mt-1">{fp.year.gan}{fp.year.zhi} {fp.month.gan}{fp.month.zhi} {fp.day.gan}{fp.day.zhi} {fp.hour.gan || '—'}{fp.hour.zhi || '—'}</div>
          </div>
          <div className="text-2xl md:text-3xl font-bold tracking-widest font-serif-cn">
            {fp.year.gan}{fp.year.zhi} {fp.month.gan}{fp.month.zhi} {fp.day.gan}{fp.day.zhi} {fp.hour.gan || '—'}{fp.hour.zhi || '—'}
          </div>
        </div>

        <div className="grid grid-cols-4 divide-x divide-gray-100 mt-5">
          {[fp.year, fp.month, fp.day, fp.hour].map((p,i) => {
            const isUnknown = !p.gan && !p.zhi;
            return (
            <div key={i} className="text-center py-6 px-2">
              <div className="text-xs text-gray-400 mb-3 tracking-wider">{['年','月','日','时'][i]}柱</div>
              {isUnknown ? (
                <>
                  <div className="text-sm text-gray-300 font-medium mb-3">未知</div>
                  <div className="text-4xl font-bold leading-none mb-2 text-gray-300">—</div>
                  <div className="text-4xl font-bold leading-none mb-4 text-gray-300">—</div>
                  <div className="text-xs text-gray-300">三柱论命</div>
                </>
              ) : (
                <>
                  <div className="text-xs text-purple-600 font-medium mb-3">
                    {['年干','月干','日主','时干'][i]==='日主'?'主':result.shishen[['年干','月干','日主','时干'][i]]||''}
                  </div>
                  <div className="text-4xl font-bold leading-none mb-2" style={{color:WX[GWX[p.gan]]}}>{p.gan}</div>
                  <div className="text-4xl font-bold leading-none mb-4" style={{color:WX[ZWX[p.zhi]]}}>{p.zhi}</div>
                  <div className="text-xs text-gray-400 leading-relaxed">{(CG[p.zhi]||[]).join(' ')}</div>
                </>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {/* 五行 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium text-gray-700">五行力量</span>
          <div className="flex gap-4 text-sm text-gray-500">
            {sortedWx.map(([wx,ct])=>(
              <span key={wx} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{backgroundColor:WX[wx]}}/>
                {wx}{ct}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-1 h-7 rounded-lg overflow-hidden">
          {sortedWx.map(([wx,ct])=>{
            const pct = totalWx>0?ct/totalWx*100:0;
            return pct>0 ? (
              <div
                key={wx}
                className="flex items-center justify-center text-white text-xs font-medium first:rounded-l-lg last:rounded-r-lg"
                style={{width:`${pct}%`,backgroundColor:WX[wx],minWidth:28}}
              >
                {pct>8?wx:''}
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* 大运 */}
      <div className="card">
        <div className="font-medium text-gray-700 mb-4">大运</div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {dayun.map((dy,i)=>(
            <div key={i} className="flex-shrink-0 w-16 text-center py-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-400">{dy.startAge}-{dy.startAge+9}</div>
              <div className="text-xl font-bold my-1" style={{color:WX[GWX[dy.gan]]}}>
                {dy.gan}<span style={{color:WX[ZWX[dy.zhi]]}}>{dy.zhi}</span>
              </div>
              <div className="text-xs text-gray-300">第{i+1}运</div>
            </div>
          ))}
        </div>
      </div>

      {/* 流年 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="font-medium text-gray-700">流年</span>
          <span className="text-sm text-gray-400">{cy}年</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({length:15}).map((_,i)=>{
            const y=cy-2+i, g='甲乙丙丁戊己庚辛壬癸'[(y-4)%10], z='子丑寅卯辰巳午未申酉戌亥'[(y-4)%12];
            return (
              <div
                key={y}
                className={`flex-shrink-0 w-14 text-center py-2.5 rounded-xl border ${
                  i===2 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className={`text-xs ${i===2 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>{y}</div>
                <div className="text-lg font-bold mt-1">
                  <span style={{color:WX[GWX[g]]}}>{g}</span>
                  <span style={{color:WX[ZWX[z]]}}>{z}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
