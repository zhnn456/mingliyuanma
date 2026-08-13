'use client';

import { useState } from 'react';

/**
 * 八字高级选项 UI 设计 Demo
 * 双列卡片式布局 + 主题色区分
 * 预览用，确认后应用到 PaipanForm.tsx
 */

type QiyunDirection = 'auto' | 'yang-male-yin-female' | 'yin-male-yang-female';
type DayunMethod = 'three-days-one-year' | 'precise-minutes';
type CangganMethod = 'full' | 'benqi-only';
type ShenshaMethod = 'full' | 'common' | 'none';

// 四个选项的主题色配置
const themes = {
  qiyun: {
    name: '起运方向',
    icon: '🧭',
    color: 'violet', // 紫色 - 方位感
    desc: '按性别与年干阴阳决定大运排布方向',
  },
  dayun: {
    name: '大运排法',
    icon: '⏳',
    color: 'cyan', // 青色 - 时间流转
    desc: '三天一岁为传统排法，精确到分按实际节令间隔计算',
  },
  canggan: {
    name: '藏干排法',
    icon: '🪨',
    color: 'amber', // 琥珀 - 层次感
    desc: '完整藏干含本气中气余气，简略仅显示本气',
  },
  shensha: {
    name: '神煞排法',
    icon: '✨',
    color: 'emerald', // 翠绿 - 玄学神煞
    desc: '完整神煞约30+种，常用约10种核心神煞',
  },
} as const;

// 主题色对应的 Tailwind 类名映射
const colorMap: Record<string, {
  bg: string;
  border: string;
  accent: string;
  text: string;
  selectBorder: string;
  selectFocus: string;
  iconBg: string;
}> = {
  violet: {
    bg: 'bg-violet-50/40',
    border: 'border-violet-200/60',
    accent: 'bg-violet-500',
    text: 'text-violet-700',
    selectBorder: 'border-violet-200 focus:border-violet-400 focus:ring-violet-100',
    selectFocus: 'focus:ring-violet-100',
    iconBg: 'bg-violet-100',
  },
  cyan: {
    bg: 'bg-cyan-50/40',
    border: 'border-cyan-200/60',
    accent: 'bg-cyan-500',
    text: 'text-cyan-700',
    selectBorder: 'border-cyan-200 focus:border-cyan-400 focus:ring-cyan-100',
    selectFocus: 'focus:ring-cyan-100',
    iconBg: 'bg-cyan-100',
  },
  amber: {
    bg: 'bg-amber-50/40',
    border: 'border-amber-200/60',
    accent: 'bg-amber-500',
    text: 'text-amber-700',
    selectBorder: 'border-amber-200 focus:border-amber-400 focus:ring-amber-100',
    selectFocus: 'focus:ring-amber-100',
    iconBg: 'bg-amber-100',
  },
  emerald: {
    bg: 'bg-emerald-50/40',
    border: 'border-emerald-200/60',
    accent: 'bg-emerald-500',
    text: 'text-emerald-700',
    selectBorder: 'border-emerald-200 focus:border-emerald-400 focus:ring-emerald-100',
    selectFocus: 'focus:ring-emerald-100',
    iconBg: 'bg-emerald-100',
  },
};

export default function DemoAdvancedOptionsPage() {
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [qiyunDirection, setQiyunDirection] = useState<QiyunDirection>('auto');
  const [dayunMethod, setDayunMethod] = useState<DayunMethod>('three-days-one-year');
  const [cangganMethod, setCangganMethod] = useState<CangganMethod>('full');
  const [shenshaMethod, setShenshaMethod] = useState<ShenshaMethod>('full');

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-xs tracking-widest text-red-700/60 font-medium">ADVANCED OPTIONS · 高级选项设计</div>
          <h1 className="text-2xl font-bold font-kai text-gray-900 mt-2">八字排盘高级选项 UI 预览</h1>
          <p className="text-sm text-gray-500 mt-2">双列卡片式布局 · 主题色区分 · 参考 demo-bazi 风格</p>
        </div>

        {/* 模拟表单容器 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {/* 模拟其他表单字段 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 opacity-50">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">姓名</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" placeholder="选填" disabled />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">性别</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" placeholder="男" disabled />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">出生日期</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" placeholder="1990-01" disabled />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">时辰</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" placeholder="子时" disabled />
            </div>
          </div>

          {/* ===== 高级选项（新设计） ===== */}
          <div className="border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left mb-4 group"
            >
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-red-700 to-amber-600 rounded-full" />
                <span className="text-sm font-bold text-gray-700">高级选项</span>
                <span className="text-xs text-gray-400">· 排盘细节自定义</span>
              </div>
              <svg className={`w-5 h-5 text-gray-400 transition-transform group-hover:text-gray-600 ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 起运方向 - 紫色主题 */}
                <AdvancedCard
                  theme={colorMap.violet}
                  icon={themes.qiyun.icon}
                  name={themes.qiyun.name}
                  desc={themes.qiyun.desc}
                >
                  <select
                    value={qiyunDirection}
                    onChange={(e) => setQiyunDirection(e.target.value as QiyunDirection)}
                    className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-colors ${colorMap.violet.selectBorder} focus:ring-2`}
                  >
                    <option value="auto">自动判断（阳男阴女顺行）</option>
                    <option value="yang-male-yin-female">阳男阴女顺行</option>
                    <option value="yin-male-yang-female">阴男阳女逆行</option>
                  </select>
                </AdvancedCard>

                {/* 大运排法 - 青色主题 */}
                <AdvancedCard
                  theme={colorMap.cyan}
                  icon={themes.dayun.icon}
                  name={themes.dayun.name}
                  desc={themes.dayun.desc}
                >
                  <select
                    value={dayunMethod}
                    onChange={(e) => setDayunMethod(e.target.value as DayunMethod)}
                    className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-colors ${colorMap.cyan.selectBorder} focus:ring-2`}
                  >
                    <option value="three-days-one-year">三天一岁（传统）</option>
                    <option value="precise-minutes">精确到分（更准）</option>
                  </select>
                </AdvancedCard>

                {/* 藏干排法 - 琥珀主题 */}
                <AdvancedCard
                  theme={colorMap.amber}
                  icon={themes.canggan.icon}
                  name={themes.canggan.name}
                  desc={themes.canggan.desc}
                >
                  <select
                    value={cangganMethod}
                    onChange={(e) => setCangganMethod(e.target.value as CangganMethod)}
                    className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-colors ${colorMap.amber.selectBorder} focus:ring-2`}
                  >
                    <option value="full">本气·中气·余气（完整）</option>
                    <option value="benqi-only">仅本气（简略）</option>
                  </select>
                </AdvancedCard>

                {/* 神煞排法 - 翠绿主题 */}
                <AdvancedCard
                  theme={colorMap.emerald}
                  icon={themes.shensha.icon}
                  name={themes.shensha.name}
                  desc={themes.shensha.desc}
                >
                  <select
                    value={shenshaMethod}
                    onChange={(e) => setShenshaMethod(e.target.value as ShenshaMethod)}
                    className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-colors ${colorMap.emerald.selectBorder} focus:ring-2`}
                  >
                    <option value="full">完整神煞</option>
                    <option value="common">常用神煞</option>
                    <option value="none">不显示神煞</option>
                  </select>
                </AdvancedCard>
              </div>
            )}
          </div>

          {/* 排盘按钮 */}
          <button className="w-full mt-5 px-4 py-3 bg-gradient-to-r from-red-700 to-red-800 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
            开始排盘
          </button>
        </div>

        {/* 当前选择预览 */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-2">当前选择（验证数据流）：</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-gray-600">起运方向：</span>
              <span className="font-mono text-violet-700">{qiyunDirection}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              <span className="text-gray-600">大运排法：</span>
              <span className="font-mono text-cyan-700">{dayunMethod}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-gray-600">藏干排法：</span>
              <span className="font-mono text-amber-700">{cangganMethod}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-600">神煞排法：</span>
              <span className="font-mono text-emerald-700">{shenshaMethod}</span>
            </div>
          </div>
        </div>

        {/* 设计说明 */}
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-red-700 rounded-full" />
            设计说明
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">●</span>
              <span><strong>双列排列</strong>：4个选项分成 2×2 网格，告别通栏堆叠，节省纵向空间</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">●</span>
              <span><strong>主题色区分</strong>：紫/青/琥珀/翠绿四种主题色，每个选项有独立视觉身份</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">●</span>
              <span><strong>卡片化</strong>：左侧装饰条 + 图标徽章 + 标题 + 说明，层次清晰</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">●</span>
              <span><strong>响应式</strong>：移动端自动堆叠为单列，PC端双列并排</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">●</span>
              <span><strong>数据流不变</strong>：选择项与原 PaipanForm 完全一致，不影响排盘算法</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 单个高级选项卡片组件
function AdvancedCard({
  theme,
  icon,
  name,
  desc,
  children,
}: {
  theme: typeof colorMap[keyof typeof colorMap];
  icon: string;
  name: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative rounded-xl border ${theme.border} ${theme.bg} p-4 overflow-hidden transition-all hover:shadow-sm`}>
      {/* 左侧装饰条 */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${theme.accent}`} />

      {/* 头部：图标 + 名称 */}
      <div className="flex items-center gap-2 mb-2.5 ml-1">
        <div className={`w-7 h-7 rounded-lg ${theme.iconBg} flex items-center justify-center text-sm`}>
          {icon}
        </div>
        <div>
          <div className={`text-sm font-bold ${theme.text}`}>{name}</div>
        </div>
      </div>

      {/* 选择控件 */}
      <div className="ml-1">{children}</div>

      {/* 说明文字 */}
      <p className="text-xs text-gray-400 mt-2 ml-1 leading-relaxed">{desc}</p>
    </div>
  );
}
