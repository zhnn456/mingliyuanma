'use client';

import { useMemo } from 'react';
import { BaziResult, TIAN_GAN_WU_XING, DI_ZHI_WU_XING, DI_ZHI } from '@/types';
import {
  analyzeQiangRuo, getTiaoHou, getShiErGong,
  analyzeRelations, getKongWang, getShiShen as getShiShenFn,
  ALL_SHEN_SHA
} from '@/lib/interpretation/bazi-analysis';

// ========== 基础数据 ==========
const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const GAN_ZHI_WUXING: Record<string,string> = {...TIAN_GAN_WU_XING, ...DI_ZHI_WU_XING};

// 十二地支所属月份
const ZHI_MONTH: Record<string,number> = {'寅':1,'卯':2,'辰':3,'巳':4,'午':5,'未':6,'申':7,'酉':8,'戌':9,'亥':10,'子':11,'丑':12};

// 颜色工具
const WXC = (wx:string) => {
  const m:Record<string,string>={'金':'#c8a45c','木':'#2d8c3c','水':'#1a5276','火':'#b91c1c','土':'#8b6914'};
  return m[wx]||'#666';
};
const WXBG = (wx:string) => {
  const m:Record<string,string>={'金':'bg-yellow-50','木':'bg-green-50','水':'bg-blue-50','火':'bg-red-50','土':'bg-amber-50'};
  return m[wx]||'bg-gray-50';
};

// ========== 组件 ==========
interface Props {
  result: BaziResult;
  xiYongShen: { xi: string; yong: string; ji: string } | null;
}

export function BaziProfessionalAnalysis({ result, xiYongShen }: Props) {
  const { fourPillars, wuxing, dayun, gender } = result;
  const dayGan = fourPillars.day.gan;
  const dayZhi = fourPillars.day.zhi;
  const monthZhi = fourPillars.month.zhi;
  const month = ZHI_MONTH[monthZhi] || 1;

  // 四柱干支组合
  const allGanZhi = [
    fourPillars.year.gan+fourPillars.year.zhi,
    fourPillars.month.gan+fourPillars.month.zhi,
    fourPillars.day.gan+fourPillars.day.zhi,
    fourPillars.hour.gan+fourPillars.hour.zhi,
  ];
  const gans = [fourPillars.year.gan, fourPillars.month.gan, fourPillars.day.gan, fourPillars.hour.gan];
  const zhis = [fourPillars.year.zhi, fourPillars.month.zhi, fourPillars.day.zhi, fourPillars.hour.zhi];

  // ========== 1. 日主强弱分析 ==========
  const qiangRuo = useMemo(() => analyzeQiangRuo(dayGan, monthZhi, allGanZhi), [dayGan, monthZhi, allGanZhi]);
  const levelColors: Record<string,string> = {'极强':'bg-red-100 text-red-800','偏强':'bg-orange-100 text-orange-800','中和':'bg-green-100 text-green-800','偏弱':'bg-blue-100 text-blue-800','极弱':'bg-purple-100 text-purple-800'};

  // ========== 2. 调候分析 ==========
  const tiaoHou = useMemo(() => getTiaoHou(dayGan, month), [dayGan, month]);

  // ========== 3. 格局判定 ==========
  // 简化版格局判定：看月支藏干是否透出天干
  const geJu = useMemo(() => {
    // 取月支的所有藏干
    const cangList: Record<string, string[]> = {
      '寅':['甲','丙','戊'],'卯':['乙'],'辰':['戊','乙','癸'],
      '巳':['丙','庚','戊'],'午':['丁','己'],'未':['己','丁','乙'],
      '申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],
      '亥':['壬','甲'],'子':['癸'],'丑':['己','癸','辛'],
    };
    const cang = cangList[monthZhi] || [];
    // 月支藏干透出天干的情况
    const touGan = cang.filter(c => gans.includes(c));
    
    // 根据透出的藏干+月令定格局
    if (touGan.length === 0) {
      // 无透出，以月支本气论
      const benQi = cang[0];
      const baziShiShen = getShiShenFn(dayGan, benQi);
      return { name: `${baziShiShen}格`, touGan: [], benQi };
    }
    
    // 取第一个透出的藏干
    const main = touGan[0];
    const ss = getShiShenFn(dayGan, main);
    let geName = ss + '格';
    if (ss === '比肩' || ss === '劫财') geName = '建禄格';
    if (ss === '七杀' && gans.includes('食神') || gans.includes('伤官')) geName = '七杀格（有制）';
    return { name: geName, touGan, benQi: cang[0] };
  }, [monthZhi, gans, dayGan]);

  // ========== 4. 长生十二宫 ==========
  const shiErGongData = useMemo(() => {
    return zhis.map((z, i) => {
      const g = getShiErGong(dayGan, z);
      return { pillar: ['年','月','日','时'][i], gan: gans[i], zhi: zhis[i], ...g };
    });
  }, [dayGan, zhis, gans]);

  // ========== 5. 刑冲合害 ==========
  const relations = useMemo(() => analyzeRelations(gans, zhis), [gans, zhis]);

  // ========== 6. 空亡 ==========
  const kongWang = useMemo(() => getKongWang(dayGan, dayZhi), [dayGan, dayZhi]);

  // ========== 7. 神煞 ==========
  const shenShaList = useMemo(() => {
    const sl: [string, string[]][] = [];
    const ygz = fourPillars.year.gan + fourPillars.year.zhi;
    Object.entries(ALL_SHEN_SHA).forEach(([name, fn]) => {
      const r = fn(dayGan, fourPillars.year.zhi, ygz, String(month));
      if (r.length > 0) sl.push([name, r]);
    });
    return sl;
  }, [dayGan, fourPillars, month]);

  // ========== 8. 通根透干 ==========
  // 通根透干（简化版：检查天干是否在地支有同五行）
  const tongGen = useMemo(() => {
    const items: { gan: string; hasRoot: boolean; rootZhi: string }[] = [];
    gans.forEach((g, i) => {
      if (i === 2) return;
      const wx = TIAN_GAN_WU_XING[g];
      const rootZhis = zhis.filter((z, zi) => {
        if (zi === i) return false;
        const cang: Record<string, string[]> = {
          '寅':['甲','丙','戊'],'卯':['乙'],'辰':['戊','乙','癸'],
          '巳':['丙','庚','戊'],'午':['丁','己'],'未':['己','丁','乙'],
          '申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],
          '亥':['壬','甲'],'子':['癸'],'丑':['己','癸','辛'],
        };
        return (cang[z]||[]).some(cg => TIAN_GAN_WU_XING[cg] === wx);
      });
      items.push({
        gan: g,
        hasRoot: rootZhis.length > 0,
        rootZhi: rootZhis.length > 0 ? rootZhis.join('、') : '-',
      });
    });
    return items;
  }, [gans, zhis]);

  return (
    <div className="space-y-6">
      {/* 1. 命盘摘要 */}
      <div className="card bg-gradient-to-br from-red-50 to-white border border-red-200">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">📋</span>
          <h2 className="card-title !mb-0">命盘摘要</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="p-3 bg-white rounded-lg border">
            <div className="text-gray-400 text-xs">日主</div>
            <div className="font-bold text-lg" style={{color:WXC(TIAN_GAN_WU_XING[dayGan])}}>{dayGan}</div>
            <div className="text-xs text-gray-500">{TIAN_GAN_WU_XING[dayGan]}性</div>
          </div>
          <div className="p-3 bg-white rounded-lg border">
            <div className="text-gray-400 text-xs">格局</div>
            <div className="font-bold text-gray-800">{geJu.name}</div>
            <div className="text-xs text-gray-500">月令确定</div>
          </div>
          <div className="p-3 bg-white rounded-lg border">
            <div className="text-gray-400 text-xs">强弱</div>
            <div className={`font-bold ${qiangRuo.level==='极强'||qiangRuo.level==='偏强'?'text-red-600':qiangRuo.level==='极弱'||qiangRuo.level==='偏弱'?'text-blue-600':'text-green-600'}`}>
              {qiangRuo.level}
            </div>
            <div className="text-xs text-gray-500">得分 {qiangRuo.score}</div>
          </div>
          <div className="p-3 bg-white rounded-lg border">
            <div className="text-gray-400 text-xs">用神/忌神</div>
            <div className="flex gap-2">
              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold">用{qiangRuo.yongShen}</span>
              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">忌{qiangRuo.jiShen}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 日主强弱详解 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">⚖️</span>
          <h2 className="card-title !mb-0">日主强弱分析</h2>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${levelColors[qiangRuo.level]}`}>{qiangRuo.level}</span>
        </div>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-medium">日主 <strong className="text-lg" style={{color:WXC(TIAN_GAN_WU_XING[dayGan])}}>{dayGan}</strong>（{TIAN_GAN_WU_XING[dayGan]}性）生于{monthZhi}月。</p>
          {qiangRuo.details.map((d, i) => (
            <div key={i} className={`p-2 rounded-lg border ${d.includes('得令')||d.includes('得地')||d.includes('得势')?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}>
              <span className={d.includes('得')?'text-green-700':'text-red-700'}>{d}</span>
            </div>
          ))}
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
            <p><strong>综合判断：</strong>日主<strong className={qiangRuo.level==='中和'?'text-green-600':''}>{qiangRuo.level}</strong>。
              {qiangRuo.level==='极强'||qiangRuo.level==='偏强'
                ? '宜克泄耗，用官杀、食伤、财星。'
                : qiangRuo.level==='极弱'||qiangRuo.level==='偏弱'
                ? '宜生扶，用印星、比劫。'
                : '宜平衡发展，根据大运流年调候。'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. 气候调候 */}
      {tiaoHou && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🌤️</span>
            <h2 className="card-title !mb-0">气候调候（穷通宝鉴法）</h2>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
            <div className="text-sm text-gray-700">
              <p className="mb-2"><strong>{dayGan}日主生于{monthZhi}月（{month}月）</strong>，{tiaoHou.reason}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">调候用神：</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold">{tiaoHou.need}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 格局分析 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🏛️</span>
          <h2 className="card-title !mb-0">格局分析</h2>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg font-bold text-purple-800">{geJu.name}</span>
            {geJu.touGan.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                月支{monthZhi}透出{geJu.touGan.join('、')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700">
            {({
              '正官格':'月令正官透于天干，或地支会合官局。为人正直，有管理才能，宜公职。',
              '七杀格':'月令七杀透干，或杀旺得制。性格刚毅，有魄力，宜军警外科。',
              '七杀格（有制）':'七杀有食伤制化，杀印相生，贵不可言。',
              '正印格':'月令正印透干。心地善良，学业有成，得长辈庇护。',
              '偏印格':'月令偏印透干。思维独特，有特殊才能，玄学天赋。',
              '正财格':'月令正财透干。财运稳定，勤劳致富，勤俭持家。',
              '偏财格':'月令偏财透干。偏财运佳，慷慨大方，善交际。',
              '食神格':'月令食神透干。心宽体胖，有口福，才艺好。',
              '伤官格':'月令伤官透干。聪明伶俐，才华横溢，但易恃才傲物。',
              '建禄格':'月令比劫，身旺，宜独立创业。',
            } as Record<string,string>)[geJu.name] || '格局清晰。'}
          </p>
        </div>
      </div>

      {/* 5. 长生十二宫 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔄</span>
          <h2 className="card-title !mb-0">长生十二宫（日主在四柱状态）</h2>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {shiErGongData.filter(d => d.name).map((d) => (
            <div key={d.pillar} className="text-center p-3 rounded-lg border bg-white">
              <div className="text-xs text-gray-400">{d.pillar}柱 · {d.zhi}</div>
              <div className={`text-sm font-bold mt-1 ${
                ['长生','冠带','临官','帝旺'].includes(d.name) ? 'text-green-600' :
                ['衰','病','死','墓','绝'].includes(d.name) ? 'text-red-500' : 'text-yellow-600'
              }`}>{d.name}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">第{d.index+1}位</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">长生→帝旺为吉，衰→绝为凶，胎养为平。日主逢长生、帝旺则身强，逢死、绝则身弱。</p>
      </div>

      {/* 6. 刑冲合害 */}
      {relations.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔗</span>
            <h2 className="card-title !mb-0">刑冲合害</h2>
          </div>
          <div className="space-y-3">
            {relations.map((r, i) => (
              <div key={i} className="p-3 rounded-lg border bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-gray-800">{r.type}</span>
                  <span className="text-xs text-gray-500">{r.description}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.items.map((item, j) => (
                    <span key={j} className={`text-xs px-2 py-0.5 rounded ${
                      r.type.includes('冲') ? 'bg-red-100 text-red-700' :
                      r.type.includes('害') ? 'bg-orange-100 text-orange-700' :
                      r.type.includes('刑') ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. 通根透干 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🌱</span>
          <h2 className="card-title !mb-0">通根透干</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-parchment-100">
                <th className="p-2 text-left text-gray-500">天干</th>
                <th className="p-2 text-left text-gray-500">位置</th>
                <th className="p-2 text-left text-gray-500">通根情况</th>
                <th className="p-2 text-left text-gray-500">力量</th>
              </tr>
            </thead>
            <tbody>
              {allGanZhi.map((gz, i) => {
                if (i === 2) return null; // 跳过日主
                const g = gz[0];
                const z = gz[1];
                const wx = TIAN_GAN_WU_XING[g];
                const peiGan = ['年干','月干','时干'][i > 2 ? i-1 : i];
                // 检查在其他地支是否有根
                const otherZhis = zhis.filter((_, zi) => zi !== i);
                const cangData: Record<string, string[]> = {
                  '寅':['甲','丙','戊'],'卯':['乙'],'辰':['戊','乙','癸'],
                  '巳':['丙','庚','戊'],'午':['丁','己'],'未':['己','丁','乙'],
                  '申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],
                  '亥':['壬','甲'],'子':['癸'],'丑':['己','癸','辛'],
                };
                const hasRoot = otherZhis.some(oz => (cangData[oz]||[]).some(cg => TIAN_GAN_WU_XING[cg] === wx));
                return (
                  <tr key={i} className="border-b border-parchment-100">
                    <td className="p-2 font-bold" style={{color:WXC(wx)}}>{g}</td>
                    <td className="p-2 text-gray-600">{peiGan}</td>
                    <td className="p-2">
                      {hasRoot
                        ? <span className="text-green-600">✅ 有根（地支中有{wx}五行）</span>
                        : <span className="text-red-500">❌ 无根（地支中无{wx}五行）</span>}
                    </td>
                    <td className="p-2">{hasRoot ? '有力' : '漂浮'}</td>
                  </tr>
                );
              })}
              {/* 日主 */}
              <tr className="border-b border-parchment-100 bg-parchment-50">
                <td className="p-2 font-bold" style={{color:WXC(TIAN_GAN_WU_XING[dayGan])}}>{dayGan}</td>
                <td className="p-2 text-gray-600">日主</td>
                <td className="p-2">
                  <span className={qiangRuo.score >= 0 ? 'text-green-600' : 'text-red-500'}>
                    {qiangRuo.score >= 0 ? '✅ 得令有根' : '⚠️ 失令无根'}
                  </span>
                </td>
                <td className="p-2">{qiangRuo.level}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. 神煞列表 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">⭐</span>
          <h2 className="card-title !mb-0">神煞星运</h2>
          <span className="text-xs text-gray-400">（{shenShaList.length}种）</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {shenShaList.map(([name, vals]) => {
            // 吉凶分类颜色
            const jiList = ['天乙','太极','天德','月德','文昌','福星','将星','华盖','金舆','天喜','魁罡','日德'];
            const xiongList = ['劫煞','灾煞','孤辰','寡宿','亡神','羊刃'];
            const isJi = jiList.some(j => name.includes(j));
            const isXiong = xiongList.some(x => name.includes(x));
            return (
              <span key={name} className={`text-xs px-2 py-1 rounded border ${
                isJi ? 'bg-green-50 text-green-700 border-green-200' :
                isXiong ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {name}{vals.length>0 && <span className="ml-0.5 opacity-60">({vals.join('')})</span>}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">《滴天髓》云：&ldquo;吉凶神煞之多端，何如生克制化之一理。&rdquo; 神煞仅供参考，应以五行生克为主。</p>
      </div>

      {/* 9. 空亡 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🕳️</span>
          <h2 className="card-title !mb-0">空亡</h2>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-700">
            日柱<strong>{dayGan}{dayZhi}</strong>，旬中{kongWang.join('、')}为空亡。
            {kongWang.length > 0 && <span className="text-gray-500 ml-1">— 空亡之支所对应的宫位方面，易有虚名虚利之象。</span>}
          </p>
        </div>
      </div>

      {/* 10. 大运分析 */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📈</span>
          <h2 className="card-title !mb-0">大运详评</h2>
        </div>
        <div className="space-y-2">
          {dayun.map((dy, i) => {
            const ganWx = TIAN_GAN_WU_XING[dy.gan];
            const zhiWx = DI_ZHI_WU_XING[dy.zhi];
            const isYong = ganWx === qiangRuo.yongShen || zhiWx === qiangRuo.yongShen;
            const isJi = ganWx === qiangRuo.jiShen || zhiWx === qiangRuo.jiShen;
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                isYong ? 'bg-green-50 border-green-200' : isJi ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex-shrink-0 w-16 text-center">
                  <div className="text-[10px] text-gray-500">第{i+1}步</div>
                  <div className="text-lg font-bold">
                    <span style={{color:WXC(ganWx)}}>{dy.gan}</span>
                    <span style={{color:WXC(zhiWx)}}>{dy.zhi}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{dy.startAge}-{dy.startAge+9}岁</div>
                  <div className="flex gap-1 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{backgroundColor:WXC(ganWx)+'20', color:WXC(ganWx)}}>{ganWx}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{backgroundColor:WXC(zhiWx)+'20', color:WXC(zhiWx)}}>{zhiWx}</span>
                    {isYong && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">用神</span>}
                    {isJi && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">忌神</span>}
                  </div>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                  isYong ? 'bg-green-200 text-green-800' : isJi ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-600'
                }`}>{isYong ? '吉运' : isJi ? '凶运' : '平运'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 古籍引用 */}
      <div className="card bg-gradient-to-br from-yellow-50 via-white to-red-50 border border-yellow-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📜</span>
          <h2 className="card-title !mb-0">古籍参考</h2>
        </div>
        <div className="space-y-2 text-sm text-gray-700 italic">
          <p>《渊海子平》云：&ldquo;四柱者，乃人一生之定数也。格局用神，相生相克，互为表里。&rdquo;</p>
          <p>《子平真诠》云：&ldquo;格局既成，即使满盘孤辰八煞，何损其贵？格局既破，即使满盘天德贵人，何以为功？&rdquo;</p>
          <p>《穷通宝鉴》云：&ldquo;欲识三元万法宗，先观帝载与神功。坤元合德机缄通，五气偏全定吉凶。&rdquo;</p>
          <p>《滴天髓》云：&ldquo;道有体用，不可以一端论也，要在扶之抑之，得其宜。&rdquo;</p>
        </div>
      </div>
    </div>
  );
}
