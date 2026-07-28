'use client';

import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  LabelList,
} from 'recharts';

// 五行/天干/地支映射
const TGWX: Record<string,string> = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
const DZWX: Record<string,string> = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
const TG = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DZ = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

export interface KLineDataPoint {
  age: number;
  year: number;
  ganZhi: string;
  daYun: string;
  daYunGan: string;
  daYunZhi: string;
  open: number;
  close: number;
  high: number;
  low: number;
  score: number;
  reason: string;
  isGood: boolean;
}

interface LifeKLineChartProps {
  dayun: Array<{
    gan: string;
    zhi: string;
    startAge: number;
    [key: string]: any;
  }>;
  xiYongShen: {
    yong: string;
    ji: string;
    [key: string]: any;
  } | null;
  birthYear: number;
}

/* ========== 自定义 K 线柱体 ========== */
const CandleShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;

  const isUp = payload.close >= payload.open;
  const color = isUp ? '#22c55e' : '#ef4444';
  const strokeColor = isUp ? '#15803d' : '#b91c1c';

  // 计算影线位置
  const center = x + width / 2;
  const candleTop = y; // 开盘或收盘较高者的Y
  const candleBottom = y + height; // 开盘或收盘较低者的Y

  // 影线（最高/最低）
  let highY = candleTop;
  let lowY = candleBottom;

  if (props.yAxis && typeof props.yAxis.scale === 'function') {
    try {
      highY = props.yAxis.scale(payload.high);
      lowY = props.yAxis.scale(payload.low);
    } catch (e) {
      highY = candleTop;
      lowY = candleBottom;
    }
  }

  const renderHeight = height < 2 ? 2 : height;

  return (
    <g>
      {/* 影线 */}
      <line x1={center} y1={highY} x2={center} y2={lowY} stroke={strokeColor} strokeWidth={2} />
      {/* 实体 */}
      <rect
        x={x}
        y={candleTop}
        width={width}
        height={renderHeight}
        fill={color}
        stroke={strokeColor}
        strokeWidth={1}
        rx={1}
      />
    </g>
  );
};

/* ========== 自定义浮动提示框 ========== */
const CustomTooltipContent = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as KLineDataPoint;
    if (!data) return null;
    const isUp = data.close >= data.open;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-5 rounded-xl shadow-2xl border border-gray-200 z-50 min-w-[280px] max-w-[360px]">
        {/* 头部 */}
        <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2.5">
          <div>
            <p className="text-lg font-bold text-gray-800">
              {data.year}年 <span className="text-base text-gray-500">({data.age}岁)</span>
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              流年：<span className="font-semibold">{data.ganZhi}</span>
            </p>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">
              大运：{data.daYun}
            </p>
          </div>
          <div className={`text-sm font-bold px-2.5 py-1 rounded-full ${isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isUp ? '吉 ▲' : '凶 ▼'}
          </div>
        </div>

        {/* 数据网格 */}
        <div className="grid grid-cols-4 gap-2 mb-3 bg-gray-50 p-2.5 rounded-lg">
          {[
            { label: '开盘', value: data.open, color: '#6b7280' },
            { label: '收盘', value: data.close, color: isUp ? '#22c55e' : '#ef4444' },
            { label: '最高', value: data.high, color: '#8b5cf6' },
            { label: '最低', value: data.low, color: '#f59e0b' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-[11px] text-gray-500">{item.label}</div>
              <div className="font-mono font-bold text-gray-800" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* 运势解读 */}
        <div className="text-sm text-gray-700 leading-relaxed text-justify">
          {data.reason}
        </div>
      </div>
    );
  }
  return null;
};

/* ========== 最高点星标 ========== */
const PeakLabel = (props: any) => {
  const { x, y, width, value, maxHigh } = props;
  if (value !== maxHigh || !value) return null;
  return (
    <g>
      {/* 红星 */}
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        transform={`translate(${x + width / 2 - 6}, ${y - 24}) scale(0.5)`}
        fill="#ef4444"
        stroke="#b91c1c"
        strokeWidth="1"
      />
      <text
        x={x + width / 2}
        y={y - 28}
        fill="#b91c1c"
        fontSize={10}
        fontWeight="bold"
        textAnchor="middle"
      >
        {value}
      </text>
    </g>
  );
};

/* ========== 主组件 ========== */
export default function LifeKLineChart({ dayun, xiYongShen, birthYear }: LifeKLineChartProps) {
  const cy = new Date().getFullYear();

  // 生成100年的K线数据
  const chartData = useMemo<KLineDataPoint[]>(() => {
    const data: KLineDataPoint[] = [];

    for (let age = 1; age <= 100; age++) {
      const year = birthYear + age - 1;

      // 确定当前属于哪步大运
      const currentDy = dayun.find(
        (dy, i) => age >= dy.startAge && (i === dayun.length - 1 || age < dayun[i + 1].startAge)
      ) || dayun[dayun.length - 1];

      if (!currentDy) continue;

      // 流年干支
      const gIdx = (year - 4) % 10;
      const zIdx = (year - 4) % 12;
      const liuNianGan = TG[gIdx >= 0 ? gIdx : gIdx + 10];
      const liuNianZhi = DZ[zIdx >= 0 ? zIdx : zIdx + 12];
      const ganZhi = liuNianGan + liuNianZhi;

      // 计算基础分（大运分 + 流年分）
      let daYunScore = 0;
      if (xiYongShen) {
        const dyGWx = TGWX[currentDy.gan];
        const dyZWx = DZWX[currentDy.zhi];
        if (dyGWx === xiYongShen.yong) daYunScore += 30;
        if (dyZWx === xiYongShen.yong) daYunScore += 20;
        if (dyGWx === xiYongShen.ji) daYunScore -= 30;
        if (dyZWx === xiYongShen.ji) daYunScore -= 20;
      }

      let liuNianScore = 0;
      if (xiYongShen) {
        const lnGWx = TGWX[liuNianGan];
        const lnZWx = DZWX[liuNianZhi];
        if (lnGWx === xiYongShen.yong) liuNianScore += 15;
        if (lnZWx === xiYongShen.yong) liuNianScore += 10;
        if (lnGWx === xiYongShen.ji) liuNianScore -= 15;
        if (lnZWx === xiYongShen.ji) liuNianScore -= 10;
      }

      // 加一些随机波动让图表更自然
      const noise = Math.sin(age * 0.5) * 5 + Math.cos(age * 0.3) * 3;
      const base = 50 + daYunScore + liuNianScore + noise;
      const clamped = Math.max(5, Math.min(95, base));

      // 构建K线（开盘/收盘/最高/最低）
      const variation = 3 + Math.abs(noise) * 0.4;
      const open = Math.max(0, Math.min(100, clamped - variation + Math.random() * variation * 0.5));
      const close = Math.max(0, Math.min(100, clamped + variation - Math.random() * variation * 0.5));
      const high = Math.max(open, close) + Math.random() * 4 + 1;
      const low = Math.min(open, close) - Math.random() * 4 - 1;
      const score = Math.round((open + close) / 2);

      // 生成解读
      const diff = close - open;
      let reason = '';
      if (diff > 5) reason = '运势上行，把握良机，积极进取可获成果。';
      else if (diff > 0) reason = '小幅回升，稳中求进，宜守不宜攻。';
      else if (diff > -5) reason = '略有回落，审慎行事，避免冲动决策。';
      else reason = '运势下行，宜静不宜动，韬光养晦以待时机。';

      // 添加用神/忌神信息
      if (xiYongShen) {
        const lnGWx = TGWX[liuNianGan];
        const lnZWx = DZWX[liuNianZhi];
        if (lnGWx === xiYongShen.yong || lnZWx === xiYongShen.yong) {
          reason = '用神到位，诸事顺遂，大展宏图之机。';
        } else if (lnGWx === xiYongShen.ji || lnZWx === xiYongShen.ji) {
          reason = '忌神当道，谨言慎行，保守为宜。';
        }
      }

      data.push({
        age,
        year,
        ganZhi,
        daYun: `${currentDy.gan}${currentDy.zhi}`,
        daYunGan: currentDy.gan,
        daYunZhi: currentDy.zhi,
        open: Math.round(open),
        close: Math.round(close),
        high: Math.round(high),
        low: Math.round(low),
        score: Math.round(score),
        reason,
        isGood: close >= open,
      });
    }

    return data;
  }, [dayun, xiYongShen, birthYear]);

  const transformedData = chartData.map(d => ({
    ...d,
    bodyRange: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
  }));

  // 大运切换线
  const daYunChanges = chartData.filter((d, i) => i === 0 || d.daYun !== chartData[i - 1].daYun);

  // 全局最高分
  const maxHigh = chartData.length > 0 ? Math.max(...chartData.map(d => d.high)) : 100;

  return (
    <div className="space-y-6">
      {/* 大运K线图（10年步长） */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="card-title !mb-1">人生运势K线 · 大运</h2>
            <p className="text-sm text-gray-400 ml-5">每步大运运势走势 · 绿色为吉 · 红色为凶</p>
          </div>
          <div className="flex gap-3 text-xs font-medium">
            <span className="flex items-center text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
              <span className="w-2.5 h-2.5 bg-green-500 mr-1.5 rounded-full" /> 吉运
            </span>
            <span className="flex items-center text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
              <span className="w-2.5 h-2.5 bg-red-500 mr-1.5 rounded-full" /> 凶运
            </span>
          </div>
        </div>

        <div className="w-full h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={transformedData.filter((d, i) => {
                // 只显示每步大运的第一年
                return daYunChanges.some(c => c.age === d.age);
              })}
              margin={{ top: 30, right: 16, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="age"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                interval={0}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                label={{ value: '年龄', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#9ca3af' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                label={{ value: '运势分', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' }}
              />
              <Tooltip content={<CustomTooltipContent />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Bar dataKey="bodyRange" shape={<CandleShape />} isAnimationActive={true} animationDuration={1200}>
                <LabelList dataKey="high" position="top" content={<PeakLabel maxHigh={maxHigh} />} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 流年K线图（年度） */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="card-title !mb-1">流年运势K线</h2>
            <p className="text-sm text-gray-400 ml-5">每年运势走势 · 可点击查看详情</p>
          </div>
          <div className="text-sm text-gray-400">
            当前：{cy}年
          </div>
        </div>

        <div className="w-full h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={transformedData}
              margin={{ top: 30, right: 16, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />

              <XAxis
                dataKey="age"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                interval={9}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                label={{ value: '年龄', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#9ca3af' }}
              />

              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                label={{ value: '运势分', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#9ca3af' }}
              />

              <Tooltip content={<CustomTooltipContent />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />

              {/* 大运切换参考线 */}
              {daYunChanges.map((point, index) => (
                <ReferenceLine
                  key={`dayun-${index}`}
                  x={point.age}
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                >
                  <Label
                    value={point.daYun}
                    position="top"
                    fill="#6366f1"
                    fontSize={10}
                    fontWeight="bold"
                  />
                </ReferenceLine>
              ))}

              <Bar dataKey="bodyRange" shape={<CandleShape />} isAnimationActive={true} animationDuration={1500}>
                <LabelList dataKey="high" position="top" content={<PeakLabel maxHigh={maxHigh} />} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 底部当前年份标签 */}
        <div className="mt-3 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-500">关注年份：</span>
            <span className="font-bold text-red-700">{cy}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">
              {TG[(cy-4)%10]}{DZ[(cy-4)%12]}年
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
