'use client';

import { BaziResult, TIAN_GAN_WU_XING, DI_ZHI_WU_XING, DI_ZHI_CANG_GAN, NA_YIN } from '@/types';

interface BaziChartProps {
  result: BaziResult;
}

// 五行的颜色和背景
function getWuxingStyle(wx: string) {
  const map: Record<string, { color: string; bg: string; border: string; light: string }> = {
    '金': { color: '#c8a45c', bg: 'bg-yellow-100', border: 'border-yellow-300', light: 'bg-yellow-50' },
    '木': { color: '#2d8c3c', bg: 'bg-green-100', border: 'border-green-300', light: 'bg-green-50' },
    '水': { color: '#1a5276', bg: 'bg-blue-100', border: 'border-blue-300', light: 'bg-blue-50' },
    '火': { color: '#b91c1c', bg: 'bg-red-100', border: 'border-red-300', light: 'bg-red-50' },
    '土': { color: '#8b6914', bg: 'bg-amber-100', border: 'border-amber-300', light: 'bg-amber-50' },
  };
  return map[wx] || { color: '#666', bg: 'bg-gray-100', border: 'border-gray-300', light: 'bg-gray-50' };
}

// 简化神煞数据
function getShenSha(yearZhi: string, dayGan: string, monthZhi: string): Record<string, string[]> {
  const sha: Record<string, string[]> = {};
  
  // 天乙贵人 (贵人)
  const tianyiGuiRen: Record<string, string> = { '甲': '丑未', '乙': '子申', '丙': '酉亥', '丁': '酉亥', '戊': '丑未', '己': '子申', '庚': '丑未', '辛': '午寅', '壬': '卯巳', '癸': '卯巳' };
  if (tianyiGuiRen[dayGan]) sha['天乙贵人'] = tianyiGuiRen[dayGan].split('').map(z => `${z}方`);
  
  // 文昌贵人
  const wenchang: Record<string, string> = { '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申', '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯' };
  if (wenchang[dayGan]) sha['文昌贵人'] = [wenchang[dayGan] + '方'];
  
  // 桃花
  const taoHua: Record<string, string> = { '寅': '卯', '午': '卯', '戌': '卯', '亥': '子', '卯': '子', '未': '子', '申': '酉', '子': '酉', '辰': '酉', '巳': '午', '酉': '午', '丑': '午' };
  if (taoHua[yearZhi]) sha['桃花'] = [taoHua[yearZhi]];
  
  // 驿马
  const yiMa: Record<string, string> = { '寅': '申', '午': '申', '戌': '申', '亥': '巳', '卯': '巳', '未': '巳', '申': '寅', '子': '寅', '辰': '寅', '巳': '亥', '酉': '亥', '丑': '亥' };
  if (yiMa[yearZhi]) sha['驿马'] = [yiMa[yearZhi]];
  
  // 华盖
  const huaGai: Record<string, string> = { '寅': '戌', '午': '戌', '戌': '戌', '亥': '丑', '卯': '丑', '未': '丑', '申': '辰', '子': '辰', '辰': '辰', '巳': '未', '酉': '未', '丑': '未' };
  if (huaGai[yearZhi]) sha['华盖'] = [huaGai[yearZhi]];
  
  return sha;
}

export function BaziChart({ result }: BaziChartProps) {
  const { fourPillars, shishen, nayin, canggan, shengxiao, wuxing, dayun, gender } = result;

  const pillars = [
    { label: '年柱', ...fourPillars.year, pillarKey: 'year' as const },
    { label: '月柱', ...fourPillars.month, pillarKey: 'month' as const },
    { label: '日柱', ...fourPillars.day, pillarKey: 'day' as const },
    { label: '时柱', ...fourPillars.hour, pillarKey: 'hour' as const },
  ];

  const shishenKeys = ['年干', '月干', '日主', '时干'];
  const shishenZhiKeys = ['年支', '月支', '日支', '时支'];
  
  // 神煞
  const shenSha = getShenSha(fourPillars.year.zhi, fourPillars.day.gan, fourPillars.month.zhi);

  // 五行分布计算
  const total = Object.values(wuxing).reduce((a, b) => a + b, 0);
  const maxWx = Object.entries(wuxing).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="card !p-0 overflow-hidden">
      {/* 标题 */}
      <div className="bg-gradient-to-r from-red-800 to-red-900 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-serif), serif' }}>八字命盘</h2>
          <div className="flex items-center gap-3">
            <span className="seal-tag-gold !text-white !border-white/50">{gender === 'male' ? '乾造' : '坤造'}</span>
            <span className="seal-tag-gold !text-white !border-white/50">生肖 {shengxiao}</span>
          </div>
        </div>
      </div>

      {/* 四柱命盘表格 */}
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-16 p-1.5 text-xs text-gray-500 font-medium border-b border-parchment-200"></th>
                {['年柱', '月柱', '日柱', '时柱'].map((label, i) => (
                  <th key={label} className="p-1.5 text-center border-b border-parchment-200">
                    <span className={`text-sm font-bold ${i === 2 ? 'chinese-red' : 'text-gray-700'}`} style={{ fontFamily: 'var(--font-serif), serif' }}>
                      {label}
                    </span>
                    {i === 2 && <span className="text-[9px] text-red-500 ml-1">(日主)</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 十神行 */}
              <tr className="bg-parchment-50">
                <td className="p-1.5 text-xs text-gray-400 border-b border-parchment-200">十神</td>
                {pillars.map((p, i) => {
                  const ss = shishen[shishenKeys[i]] || '';
                  return (
                    <td key={p.label} className="p-1.5 text-center border-b border-parchment-200">
                      <span className={`text-xs font-medium ${i === 2 ? 'chinese-red font-bold' : 'text-purple-600'}`}>
                        {ss}
                      </span>
                    </td>
                  );
                })}
              </tr>
              {/* 天干行 */}
              <tr>
                <td className="p-1.5 text-xs text-gray-400 border-b border-parchment-200">天干</td>
                {pillars.map((p) => {
                  const ganWx = TIAN_GAN_WU_XING[p.gan];
                  const style = getWuxingStyle(ganWx);
                  return (
                    <td key={p.label} className="p-2 text-center border-b border-parchment-200">
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold" style={{ color: style.color }}>{p.gan}</span>
                        <span className={`text-[10px] mt-0.5 px-1.5 py-0.5 rounded ${style.bg}`} style={{ color: style.color }}>{ganWx}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
              {/* 地支行 */}
              <tr>
                <td className="p-1.5 text-xs text-gray-400 border-b border-parchment-200">地支</td>
                {pillars.map((p) => {
                  const zhiWx = DI_ZHI_WU_XING[p.zhi];
                  const style = getWuxingStyle(zhiWx);
                  return (
                    <td key={p.label} className="p-2 text-center border-b border-parchment-200">
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold" style={{ color: style.color }}>{p.zhi}</span>
                        <span className={`text-[10px] mt-0.5 px-1.5 py-0.5 rounded ${style.bg}`} style={{ color: style.color }}>{zhiWx}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
              {/* 藏干行 */}
              <tr className="bg-parchment-50/50">
                <td className="p-1.5 text-xs text-gray-400 border-b border-parchment-200">藏干</td>
                {pillars.map((p) => {
                  const cg = canggan[p.label] || [];
                  return (
                    <td key={p.label} className={`p-1.5 text-center border-b border-parchment-200 ${cg.length === 0 ? 'text-gray-300' : ''}`}>
                      <div className="flex flex-wrap justify-center gap-0.5">
                        {cg.map((gan, i) => {
                          const ganWx = TIAN_GAN_WU_XING[gan];
                          const style = getWuxingStyle(ganWx);
                          return (
                            <span key={i} className={`text-xs px-1 rounded ${style.bg} ${style.border} border`} style={{ color: style.color }}>
                              {gan}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
              {/* 纳音行 */}
              <tr>
                <td className="p-1.5 text-xs text-gray-400 border-b border-parchment-200">纳音</td>
                {pillars.map((p) => {
                  const ny = nayin[p.label] || NA_YIN[`${p.gan}${p.zhi}`] || '';
                  return (
                    <td key={p.label} className="p-1.5 text-center border-b border-parchment-200">
                      <span className="text-xs text-gray-600 font-medium">{ny}</span>
                    </td>
                  );
                })}
              </tr>
              {/* 神煞行 */}
              <tr className="bg-parchment-50/50">
                <td className="p-1.5 text-xs text-gray-400">神煞</td>
                <td colSpan={4} className="p-1.5 text-center">
                  <div className="flex flex-wrap justify-center gap-1">
                    {Object.entries(shenSha).map(([name, positions]) => (
                      <span key={name} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-parchment-100 text-parchment-700 rounded">
                        {name}：{positions.join('、')}
                      </span>
                    ))}
                    {Object.keys(shenSha).length === 0 && <span className="text-[10px] text-gray-400">—</span>}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 五行力量条 */}
        <div className="mt-4 pt-3 border-t border-parchment-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-700" style={{ fontFamily: 'var(--font-serif), serif' }}>五行力量</h3>
            <span className="text-xs text-gray-500">
              日主：<strong style={{ color: getWuxingStyle(TIAN_GAN_WU_XING[fourPillars.day.gan]).color }}>{fourPillars.day.gan}</strong>
              （{TIAN_GAN_WU_XING[fourPillars.day.gan]}）
            </span>
          </div>
          <div className="flex gap-0.5 h-7 rounded-lg overflow-hidden">
            {Object.entries(wuxing).map(([wx, count]) => {
              const pct = total > 0 ? (count / total) * 100 : 0;
              if (pct === 0) return null;
              const style = getWuxingStyle(wx);
              const isMax = wx === maxWx?.[0];
              return (
                <div
                  key={wx}
                  className={`flex items-center justify-center text-white text-xs font-bold transition-all ${isMax ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                  style={{ width: `${pct}%`, backgroundColor: style.color, minWidth: pct > 0 ? '2rem' : '0' }}
                  title={`${wx}: ${count}个 (${Math.round(pct)}%)`}
                >
                  {pct > 8 && `${wx}${count}`}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
            <span>总计 {total} 个五行元素</span>
            <span>最旺：{maxWx?.[0]}（{maxWx?.[1]}个）</span>
          </div>
        </div>
      </div>
    </div>
  );
}
