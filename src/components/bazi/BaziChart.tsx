'use client';

import { useMemo } from 'react';
import { BaziResult, TIAN_GAN_WU_XING, DI_ZHI_WU_XING } from '@/types';

interface Props { result: BaziResult; }

const WX = (wx: string) => {
  const map: Record<string, {c:string;bg:string;b:string}> = {
    '金': {c:'#c8a45c',bg:'bg-yellow-100',b:'border-yellow-300'},
    '木': {c:'#2d8c3c',bg:'bg-green-100',b:'border-green-300'},
    '水': {c:'#1a5276',bg:'bg-blue-100',b:'border-blue-300'},
    '火': {c:'#b91c1c',bg:'bg-red-100',b:'border-red-300'},
    '土': {c:'#8b6914',bg:'bg-amber-100',b:'border-amber-300'},
  };
  return map[wx] || {c:'#666',bg:'bg-gray-100',b:'border-gray-300'};
};

// 完整神煞规则
const SHEN_SHA_RULES: Record<string, (dg:string, yz:string, ygz:string, mz?:string) => string[]> = {
  '天乙贵人': (dg) => { const m:{[k:string]:string}={'甲':'丑未','乙':'子申','丙':'酉亥','丁':'酉亥','戊':'丑未','己':'子申','庚':'丑未','辛':'午寅','壬':'卯巳','癸':'卯巳'}; const v=m[dg]; return v?v.split('').map(z=>z+'方'):[]; },
  '文昌贵人': (dg) => { const m:{[k:string]:string}={'甲':'巳','乙':'午','丙':'申','丁':'酉','戊':'申','己':'酉','庚':'亥','辛':'子','壬':'寅','癸':'卯'}; return m[dg]?[m[dg]]:[]; },
  '桃花': (_,yz) => { const m:{[k:string]:string}={'寅':'卯','午':'卯','戌':'卯','亥':'子','卯':'子','未':'子','申':'酉','子':'酉','辰':'酉','巳':'午','酉':'午','丑':'午'}; return m[yz]?[m[yz]]:[]; },
  '驿马': (_,yz) => { const m:{[k:string]:string}={'寅':'申','午':'申','戌':'申','亥':'巳','卯':'巳','未':'巳','申':'寅','子':'寅','辰':'寅','巳':'亥','酉':'亥','丑':'亥'}; return m[yz]?[m[yz]]:[]; },
  '华盖': (_,yz) => { const m:{[k:string]:string}={'寅':'戌','午':'戌','戌':'戌','亥':'丑','卯':'丑','未':'丑','申':'辰','子':'辰','辰':'辰','巳':'未','酉':'未','丑':'未'}; return m[yz]?[m[yz]]:[]; },
  '劫煞': (_,yz) => { const m:{[k:string]:string}={'寅':'巳','午':'巳','戌':'巳','亥':'申','卯':'申','未':'申','申':'亥','子':'亥','辰':'亥','巳':'寅','酉':'寅','丑':'寅'}; return m[yz]?[m[yz]]:[]; },
  '灾煞': (_,yz) => { const m:{[k:string]:string}={'寅':'午','午':'午','戌':'午','亥':'酉','卯':'酉','未':'酉','申':'子','子':'子','辰':'子','巳':'卯','酉':'卯','丑':'卯'}; return m[yz]?[m[yz]]:[]; },
  '将星': (_,yz) => { const m:{[k:string]:string}={'寅':'子','午':'子','戌':'子','亥':'卯','卯':'卯','未':'卯','申':'午','子':'午','辰':'午','巳':'酉','酉':'酉','丑':'酉'}; return m[yz]?[m[yz]]:[]; },
  '月德': (_,__,___,mz) => { if(!mz) return []; const m:{[k:string]:string}={'寅':'丙','卯':'甲','辰':'壬','巳':'庚','午':'丙','未':'甲','申':'壬','酉':'庚','戌':'丙','亥':'甲','子':'壬','丑':'庚'}; return m[mz]?[m[mz]]:[]; },
  '天德': (_,__,___,mz) => { if(!mz) return []; const m:{[k:string]:string}={'寅':'丁','卯':'坤','辰':'壬','巳':'辛','午':'乾','未':'甲','申':'癸','酉':'艮','戌':'丙','亥':'乙','子':'巳','丑':'庚'}; return m[mz]?[m[mz]]:[]; },
  '太极贵人': (dg) => { const m:{[k:string]:string}={'甲':'子午','乙':'子午','丙':'卯酉','丁':'卯酉','戊':'辰戌丑未','己':'辰戌丑未','庚':'寅亥','辛':'寅亥','壬':'巳申','癸':'巳申'}; return m[dg]?[m[dg]]:[]; },
  '魁罡': (_,__,ygz) => ['庚辰','庚戌','壬辰','壬戌'].includes(ygz)?['魁罡照命']:[],
  '孤辰': (_,yz) => { const m:{[k:string]:string}={'寅':'巳','午':'巳','戌':'巳','亥':'寅','卯':'寅','未':'寅','申':'亥','子':'亥','辰':'亥','巳':'申','酉':'申','丑':'申'}; return m[yz]?[m[yz]]:[]; },
  '寡宿': (_,yz) => { const m:{[k:string]:string}={'寅':'丑','午':'丑','戌':'丑','亥':'戌','卯':'戌','未':'戌','申':'未','子':'未','辰':'未','巳':'辰','酉':'辰','丑':'辰'}; return m[yz]?[m[yz]]:[]; },
  '红鸾': (_,yz) => { const m:{[k:string]:string}={'寅':'卯','卯':'寅','辰':'丑','巳':'子','午':'亥','未':'戌','申':'酉','酉':'申','戌':'未','亥':'午','子':'巳','丑':'辰'}; return m[yz]?[m[yz]]:[]; },
};

export function BaziChart({ result }: Props) {
  const { fourPillars, wuxing, dayun, gender, shishen, nayin } = result;
  const pillars = [
    { label:'年柱',...fourPillars.year,key:'year' as const },
    { label:'月柱',...fourPillars.month,key:'month' as const },
    { label:'日柱',...fourPillars.day,key:'day' as const },
    { label:'时柱',...fourPillars.hour,key:'hour' as const },
  ];

  const allShenSha = useMemo(() => {
    const sha:[string,string[]][] = [];
    Object.entries(SHEN_SHA_RULES).forEach(([n,f]) => {
      const r = f(fourPillars.day.gan, fourPillars.year.zhi, fourPillars.year.gan+fourPillars.year.zhi, fourPillars.month.zhi);
      if (r.length>0) sha.push([n,r]);
    });
    return sha;
  }, []);

  const total = Object.values(wuxing).reduce((a,b)=>a+b, 0);
  const sorted = Object.entries(wuxing).sort((a,b)=>b[1]-a[1]);

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="bg-gradient-to-r from-red-800 to-red-900 text-white px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{fontFamily:'serif'}}>四柱八字命盘</h2>
          <div className="flex items-center gap-2">
            <span className="seal-tag-gold !text-white !border-white/50 text-[10px]">{gender==='male'?'乾造':'坤造'}</span>
            <span className="seal-tag-gold !text-white !border-white/50 text-[10px]">{fourPillars.day.gan}日主</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* 四柱核心表 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr className="bg-parchment-100">
                <th className="p-1.5 w-12 text-gray-500"></th>
                {pillars.map((p,i) => (
                  <th key={p.label} className={`p-1.5 font-bold ${i===2?'chinese-red text-sm':'text-gray-700'}`}>
                    {p.label}{i===2&&<span className="text-[9px] text-red-500 ml-0.5">(日主)</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-parchment-50/50">
                <td className="p-1 text-gray-400">十神</td>
                {['年干','月干','日主','时干'].map((k,i) => {
                  const ss = shishen[k]||'';
                  return <td key={i} className={`p-1 font-medium ${i===2?'chinese-red':'text-purple-600'}`}>{ss}</td>;
                })}
              </tr>
              <tr>
                <td className="p-1 text-gray-400">天干</td>
                {pillars.map(p => {
                  const s = WX(TIAN_GAN_WU_XING[p.gan]);
                  return <td key={p.label} className="p-2"><span className="text-3xl font-bold" style={{color:s.c}}>{p.gan}</span></td>;
                })}
              </tr>
              <tr>
                <td className="p-1 text-gray-400">地支</td>
                {pillars.map(p => {
                  const s = WX(DI_ZHI_WU_XING[p.zhi]);
                  return <td key={p.label} className="p-2"><span className="text-3xl font-bold" style={{color:s.c}}>{p.zhi}</span></td>;
                })}
              </tr>
              <tr className="bg-parchment-50/50">
                <td className="p-1 text-gray-400">藏干</td>
                {pillars.map(p => {
                  const cg = cangganDetail(p.zhi);
                  return <td key={p.label} className="p-1">
                    <div className="flex flex-wrap justify-center gap-0.5">
                      {cg.main && <span className="text-xs px-1 py-0.5 bg-red-50 text-red-700 rounded border border-red-200">{cg.main}</span>}
                      {cg.mid && <span className="text-xs px-1 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-200">{cg.mid}</span>}
                      {cg.rest && <span className="text-xs px-1 py-0.5 bg-green-50 text-green-600 rounded border border-green-200">{cg.rest}</span>}
                    </div>
                  </td>;
                })}
              </tr>
              <tr>
                <td className="p-1 text-gray-400">纳音</td>
                {pillars.map(p => (
                  <td key={p.label} className="p-1"><span className="text-gray-600 font-medium">{nayin[p.label]||''}</span></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 神煞 */}
        <div>
          <h4 className="text-xs font-bold text-gray-600 mb-1.5">📌 神煞 · {allShenSha.length}种</h4>
          <div className="flex flex-wrap gap-1">
            {allShenSha.map(([n,v]) => (
              <span key={n} className="text-[10px] px-1.5 py-0.5 rounded bg-parchment-100 text-parchment-700 border border-parchment-200">
                {n}{v.length>0&&<span className="text-gray-400 ml-0.5">({v.join('、')})</span>}
              </span>
            ))}
          </div>
        </div>

        {/* 五行力量 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-bold text-gray-600">🔥 五行力量</h4>
            <div className="flex gap-2 text-[10px]">
              {sorted.map(([wx,ct]) => (
                <span key={wx} className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full" style={{backgroundColor:WX(wx).c}}/>{wx}{ct}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-0.5 h-7 rounded-lg overflow-hidden">
            {sorted.map(([wx,ct]) => {
              const pct = total>0 ? (ct/total)*100 : 0;
              if (pct===0) return null;
              const s = WX(wx);
              return <div key={wx} className={`flex items-center justify-center text-white text-xs font-bold ${wx===sorted[0][0]?'ring-2 ring-offset-1 ring-gray-400':''}`}
                style={{width:`${pct}%`,backgroundColor:s.c,minWidth:pct>5?'1.5rem':'0'}}>
                {pct>5&&<>{wx}<span className="text-[9px] ml-0.5">{Math.round(pct)}%</span></>}
              </div>;
            })}
          </div>
        </div>

        {/* 大运简表 */}
        <div>
          <h4 className="text-xs font-bold text-gray-600 mb-1.5">📈 大运 · {dayun.length}步</h4>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {dayun.map((dy,i) => {
              const sg = WX(TIAN_GAN_WU_XING[dy.gan]);
              const sz = WX(DI_ZHI_WU_XING[dy.zhi]);
              return <div key={i} className="flex-shrink-0 w-14 text-center p-1.5 rounded-lg bg-parchment-50 border border-parchment-200">
                <div className="text-[9px] text-gray-400">{dy.startAge}-{dy.startAge+9}</div>
                <div className="text-base font-bold"><span style={{color:sg.c}}>{dy.gan}</span><span style={{color:sz.c}}>{dy.zhi}</span></div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function cangganDetail(zhi: string): {main:string;mid?:string;rest?:string} {
  const m: Record<string,{main:string;mid?:string;rest?:string}> = {
    '子':{main:'癸'},'丑':{main:'己',mid:'癸',rest:'辛'},'寅':{main:'甲',mid:'丙',rest:'戊'},
    '卯':{main:'乙'},'辰':{main:'戊',mid:'乙',rest:'癸'},'巳':{main:'丙',mid:'庚',rest:'戊'},
    '午':{main:'丁',mid:'己'},'未':{main:'己',mid:'丁',rest:'乙'},'申':{main:'庚',mid:'壬',rest:'戊'},
    '酉':{main:'辛'},'戌':{main:'戊',mid:'辛',rest:'丁'},'亥':{main:'壬',mid:'甲'},
  };
  return m[zhi]||{main:''};
}
