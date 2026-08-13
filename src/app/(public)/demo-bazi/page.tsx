'use client';

import { useState } from 'react';

/**
 * 八字排盘页面 - 新布局 Demo v2
 * 布局改进：Tab分区 + 双列网格 + 深度解读
 */

// 模拟数据 - 完整排盘信息
const mockBazi = {
  // 四柱
  pillars: [
    {
      label: '年柱', gan: '甲', zhi: '子', ganEle: '木', zhiEle: '水',
      nayin: '海中金', canggan: ['癸水'], shishen: '偏印', shensha: ['天乙贵人', '太极贵人'],
    },
    {
      label: '月柱', gan: '丙', zhi: '寅', ganEle: '火', zhiEle: '木',
      nayin: '炉中火', canggan: ['甲木', '丙火', '戊土'], shishen: '偏印', shensha: ['天德贵人', '月德贵人'],
    },
    {
      label: '日柱', gan: '戊', zhi: '午', ganEle: '土', zhiEle: '火',
      nayin: '天上火', canggan: ['丁火', '己土'], shishen: '日主', shensha: ['将星', '羊刃'],
    },
    {
      label: '时柱', gan: '庚', zhi: '申', ganEle: '金', zhiEle: '金',
      nayin: '石榴木', canggan: ['庚金', '壬水', '戊土'], shishen: '食神', shensha: ['文昌', '驿马'],
    },
  ],
  // 五行分布
  wuxing: { 木: 2, 火: 2, 土: 1, 金: 1, 水: 2 },
  // 大运
  dayun: [
    { age: '3-12', gan: '丁', zhi: '卯', nayin: '炉中火', desc: '丁火正印生身，卯木为桃花。学业初成，聪慧过人。' },
    { age: '13-22', gan: '戊', zhi: '辰', nayin: '大林木', desc: '比肩帮身，辰土蓄水。青春奋斗，事业起步。' },
    { age: '23-32', gan: '己', zhi: '巳', nayin: '大林木', desc: '巳火生土，运势上升。贵人相助，事业有成。' },
    { age: '33-42', gan: '庚', zhi: '午', nayin: '路旁土', desc: '午火正印当权，名利双收。人生高峰，宜把握机遇。' },
    { age: '43-52', gan: '辛', zhi: '未', nayin: '路旁土', desc: '未土帮身，晚年安稳。福禄双全，家庭和睦。' },
    { age: '53-62', gan: '壬', zhi: '申', nayin: '剑锋金', desc: '壬水偏财，申金食神。财运亨通，晚景富贵。' },
  ],
  // 胎元命宫
  taiyuan: '丁巳', minggong: '壬申',
};

const tabLabels = ['命盘总览', '详细解读', '深度分析'];

// 十神关系数据
const shishenRelations = [
  { name: '比肩', gan: '戊', desc: '同我者为比肩，代表兄弟姐妹、朋友同辈', trait: '独立自主、竞争意识强' },
  { name: '劫财', gan: '己', desc: '同我异性为劫财，代表争夺、竞争', trait: '果断勇敢、易冲动' },
  { name: '食神', gan: '庚', desc: '我生者为食神，代表才华、子女', trait: '温和仁慈、有艺术天赋' },
  { name: '伤官', gan: '辛', desc: '我生异性为伤官，代表聪明才艺', trait: '聪明机敏、恃才傲物' },
  { name: '偏财', gan: '壬', desc: '我克者为偏财，代表横财、意外之财', trait: '慷慨大方、善于理财' },
  { name: '正财', gan: '癸', desc: '我克异性为正财，代表正业之财', trait: '勤俭持家、稳重可靠' },
  { name: '七杀', gan: '甲', desc: '克我者为七杀，代表压力、权威', trait: '有魄力、易招是非' },
  { name: '正官', gan: '乙', desc: '克我异性为正官，代表约束、地位', trait: '守纪律、有责任感' },
  { name: '偏印', gan: '丙', desc: '生我者为偏印，代表学问、孤独', trait: '悟性高、性格内向' },
  { name: '正印', gan: '丁', desc: '生我异性为正印，代表学业、母亲', trait: '仁慈善良、依赖性强' },
];

export default function DemoBaziPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [hasResult, setHasResult] = useState(false); // 是否已排盘

  const handlePaipan = () => {
    setHasResult(true);
    setActiveTab(0);
  };

  const handleReset = () => {
    setHasResult(false);
    setActiveTab(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-white">
      {/* 装饰背景 */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ctext x='30' y='40' font-size='40' fill='%23800'%3E命%3C/text%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">

        {/* === 紧凑头部 === */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs tracking-widest text-red-700/60 font-medium">BAZI · 八字排盘</div>
            <h1 className="text-2xl font-bold font-kai text-gray-900 mt-1">八字命理排盘</h1>
          </div>
          {hasResult && (
            <button
              onClick={handleReset}
              className="text-sm text-red-700 hover:text-red-800 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重新排盘
            </button>
          )}
        </div>

        {/* === 未排盘状态：表单 + 介绍/FAQ/相关阅读 === */}
        {!hasResult && (
          <>
            {/* 输入表单 - 完整选项 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
              {/* 第一行：基本信息 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">姓名</label>
                  <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none" placeholder="选填" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">性别</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none">
                    <option>男</option>
                    <option>女</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">历法</label>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm bg-red-700 text-white rounded-lg">阳历</button>
                    <button className="flex-1 px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">农历</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">出生日期</label>
                  <input type="date" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none" />
                </div>
              </div>

              {/* 第二行：时辰选择（子午时处理） */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">出生时辰</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none">
                    <option value="">未知时辰</option>
                    <option>早子时 (00:00-01:00)</option>
                    <option>子时 (23:00-01:00) 晚子时</option>
                    <option>丑时 (01:00-03:00)</option>
                    <option>寅时 (03:00-05:00)</option>
                    <option>卯时 (05:00-07:00)</option>
                    <option>辰时 (07:00-09:00)</option>
                    <option>巳时 (09:00-11:00)</option>
                    <option>午时 (11:00-13:00)</option>
                    <option>未时 (13:00-15:00)</option>
                    <option>申时 (15:00-17:00)</option>
                    <option>酉时 (17:00-19:00)</option>
                    <option>戌时 (19:00-21:00)</option>
                    <option>亥时 (21:00-23:00)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">子时归属日</label>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm bg-red-700 text-white rounded-lg">当日 (早子时)</button>
                    <button className="flex-1 px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">次日 (晚子时)</button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">23:00后归属哪天？古法分早晚子时</div>
                </div>
              </div>

              {/* 第三行：出生地（真太阳时修正） */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">出生省份</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none">
                    <option value="">请选择省份</option>
                    <option>北京</option>
                    <option>上海</option>
                    <option>广东</option>
                    <option>浙江</option>
                    <option>江苏</option>
                    <option>四川</option>
                    <option>湖北</option>
                    <option>湖南</option>
                    <option>福建</option>
                    <option>山东</option>
                    <option>河南</option>
                    <option>河北</option>
                    <option>山西</option>
                    <option>陕西</option>
                    <option>辽宁</option>
                    <option>吉林</option>
                    <option>黑龙江</option>
                    <option>云南</option>
                    <option>贵州</option>
                    <option>广西</option>
                    <option>新疆</option>
                    <option>西藏</option>
                    <option>内蒙古</option>
                    <option>海南</option>
                    <option>甘肃</option>
                    <option>青海</option>
                    <option>宁夏</option>
                    <option>重庆</option>
                    <option>天津</option>
                    <option>安徽</option>
                    <option>江西</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">出生城市</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none">
                    <option value="">请选择城市</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">真太阳时修正</label>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg">
                      ✓ 启用
                    </button>
                    <button className="flex-1 px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                      不启用
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">根据经度修正时差，排盘更准</div>
                </div>
              </div>

              {/* 第四行：高级选项 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">起运方向</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none">
                    <option>阳男阴女顺行</option>
                    <option>阴男阳女逆行</option>
                    <option>自动判断</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">大运排法</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none">
                    <option>三天一岁</option>
                    <option>精确到分</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">藏干排法</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none">
                    <option>本气中气余气</option>
                    <option>仅本气</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">神煞排法</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none">
                    <option>完整神煞</option>
                    <option>常用神煞</option>
                    <option>不显示神煞</option>
                  </select>
                </div>
              </div>

              {/* 排盘按钮 */}
              <button
                onClick={handlePaipan}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-700 to-red-800 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                开始排盘
              </button>
            </div>

            {/* 排盘介绍 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-red-700 rounded-full" />
                什么是八字排盘？
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                八字命理，又称四柱预测学，是以人的出生年、月、日、时为基础，
                转换为天干地支来推算命运的传统方法。四柱共八个字，故称"八字"。
                天干地支蕴含五行生克关系，通过分析日主旺衰、格局用神来推断人生运势。
              </p>
            </div>

            {/* 常见问题 + 相关阅读 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-red-700 rounded-full" />
                  常见问题
                </h4>
                <div className="space-y-3">
                  <details className="group">
                    <summary className="text-sm text-gray-700 cursor-pointer hover:text-red-700 font-medium">
                      八字准确吗？
                    </summary>
                    <p className="text-xs text-gray-500 mt-2 pl-4 leading-relaxed">
                      八字是古人总结的概率统计，有一定参考价值，但非绝对。命运在自己手中，仅供参考。
                    </p>
                  </details>
                  <details className="group">
                    <summary className="text-sm text-gray-700 cursor-pointer hover:text-red-700 font-medium">
                      闰月怎么算？
                    </summary>
                    <p className="text-xs text-gray-500 mt-2 pl-4 leading-relaxed">
                      八字按节气划分月份，不按农历闰月。每月以"节"为始，如立春为寅月始。
                    </p>
                  </details>
                  <details className="group">
                    <summary className="text-sm text-gray-700 cursor-pointer hover:text-red-700 font-medium">
                      真太阳时是什么？
                    </summary>
                    <p className="text-xs text-gray-500 mt-2 pl-4 leading-relaxed">
                      真太阳时根据出生地经度修正的标准时间。北京时间以东经120度为准，
                      若出生地不在东经120度，需加减时差。
                    </p>
                  </details>
                  <details className="group">
                    <summary className="text-sm text-gray-700 cursor-pointer hover:text-red-700 font-medium">
                      什么叫"用神"？
                    </summary>
                    <p className="text-xs text-gray-500 mt-2 pl-4 leading-relaxed">
                      用神是八字中对日主最有利的五行。通过分析日主旺衰，找出能平衡命局的五行。
                    </p>
                  </details>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-red-700 rounded-full" />
                  相关阅读
                </h4>
                <div className="space-y-2">
                  <a className="block p-2 rounded hover:bg-amber-50 transition-colors text-sm text-gray-700">→ 十神详解：比肩劫财的含义</a>
                  <a className="block p-2 rounded hover:bg-amber-50 transition-colors text-sm text-gray-700">→ 大运流年入门指南</a>
                  <a className="block p-2 rounded hover:bg-amber-50 transition-colors text-sm text-gray-700">→ 五行生克关系详解</a>
                  <a className="block p-2 rounded hover:bg-amber-50 transition-colors text-sm text-gray-700">→ 格局用神分析进阶</a>
                  <a className="block p-2 rounded hover:bg-amber-50 transition-colors text-sm text-gray-700">→ 神煞吉凶判断</a>
                  <a className="block p-2 rounded hover:bg-amber-50 transition-colors text-sm text-gray-700">→ 藏干与十神关系</a>
                </div>
              </div>
            </div>
          </>
        )}

        {/* === 已排盘状态：排盘结果 + 解读（不显示介绍/FAQ/相关阅读） === */}
        {hasResult && (
          <>
        {/* === 排盘结果区 === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* 四柱（占2列） */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700">四柱八字</h3>
              <span className="text-xs text-gray-400">甲子年 · 丙寅月 · 戊午日 · 庚申时</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {mockBazi.pillars.map((pillar, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs text-gray-400 mb-2">{pillar.label}</div>
                  <div className="bg-gradient-to-b from-red-50/50 to-white border border-red-100 rounded-lg py-3">
                    <div className="text-3xl font-bold text-red-700 font-kai">{pillar.gan}</div>
                    <div className="text-3xl font-bold text-gray-800 font-kai mt-1">{pillar.zhi}</div>
                  </div>
                  <div className="flex justify-center gap-1 mt-1">
                    <span className="text-xs text-green-600">{pillar.ganEle}</span>
                    <span className="text-xs text-blue-600">{pillar.zhiEle}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{pillar.nayin}</div>
                  <div className="text-xs text-amber-600 mt-0.5">{pillar.shishen}</div>
                </div>
              ))}
            </div>
            {/* 藏干和神煞 */}
            <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
              {mockBazi.pillars.map((pillar, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs text-gray-500">藏干：{pillar.canggan.join('·')}</div>
                  <div className="text-xs text-purple-500 mt-0.5">{pillar.shensha.join(' · ')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧信息栏 */}
          <div className="space-y-4">
            {/* 五行统计 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">五行分布</h3>
              <div className="space-y-2">
                {Object.entries(mockBazi.wuxing).map(([el, count]) => (
                  <div key={el} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-6">{el}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          el === '木' ? 'bg-green-400' :
                          el === '火' ? 'bg-red-400' :
                          el === '土' ? 'bg-yellow-400' :
                          el === '金' ? 'bg-gray-300' :
                          'bg-blue-400'
                        }`}
                        style={{ width: `${(count / 8) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* 胎元命宫 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">特殊信息</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">胎元</div>
                  <div className="text-lg font-bold text-amber-700 font-kai">{mockBazi.taiyuan}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">命宫</div>
                  <div className="text-lg font-bold text-amber-700 font-kai">{mockBazi.minggong}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === Tab 切换区 === */}
        <div className="mb-6 sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="flex gap-1">
            {tabLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === i ? 'text-red-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {activeTab === i && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-700" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* === Tab 内容 === */}
        <div className="min-h-[400px]">

          {/* Tab 0: 命盘总览 */}
          {activeTab === 0 && (
            <div className="space-y-4">
              {/* 核心分析双列 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-700 rounded-full" />
                    日主分析
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
                    <p>日主为<span className="font-bold text-gray-900">戊土</span>，生于寅月（木旺之月）。</p>
                    <p>戊土为城墙之土，厚重而坚固。生于寅月，木旺土虚，需火生扶。丙火偏印透月干，化杀生身，为有力之配置。</p>
                    <p>日支午火为正印，时干庚金为食神，形成<span className="font-bold text-red-700">杀印相生</span>格局。</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-700 rounded-full" />
                    格局判断
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
                    <p>月令寅木，甲木透年干，为<span className="font-bold text-gray-900">七杀格</span>。</p>
                    <p>杀重身轻，喜印化杀。丙火透月干，杀印相生，化杀为权，主聪明才艺。</p>
                    <p>时柱庚申为食神，食神制杀，形成<span className="font-bold text-red-700">食神制杀</span>格局。</p>
                  </div>
                </div>
              </div>

              {/* 大运流年横向滚动 */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3">大运排列</h4>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {mockBazi.dayun.map((dy, i) => (
                    <div key={i} className="flex-shrink-0 text-center min-w-[90px]">
                      <div className="text-xs text-gray-400 mb-1">{dy.age}</div>
                      <div className={`bg-gradient-to-b ${i === 3 ? 'from-red-50 to-amber-50 border-red-200' : 'from-amber-50/50 to-white border-amber-100'} border rounded-lg px-3 py-2`}>
                        <span className="text-xl font-bold font-kai text-amber-700">{dy.gan}</span>
                        <span className="text-xl font-bold font-kai text-gray-700 ml-1">{dy.zhi}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{dy.nayin}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 神煞总览 */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3">命局神煞</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: '天乙贵人', pos: '年柱', desc: '逢凶化吉', type: '吉神' },
                    { name: '天德贵人', pos: '月柱', desc: '一生平安', type: '吉神' },
                    { name: '月德贵人', pos: '月柱', desc: '德高望重', type: '吉神' },
                    { name: '文昌', pos: '时柱', desc: '聪明好学', type: '吉神' },
                    { name: '将星', pos: '日柱', desc: '有领导力', type: '吉神' },
                    { name: '羊刃', pos: '日柱', desc: '刚强好胜', type: '凶神' },
                    { name: '驿马', pos: '时柱', desc: '奔波远行', type: '凶神' },
                    { name: '太极贵人', pos: '年柱', desc: '神秘缘分', type: '吉神' },
                  ].map((s, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${s.type === '吉神' ? 'bg-green-50/50 border-green-100' : 'bg-red-50/30 border-red-100'}`}>
                      <div className={`text-xs font-bold ${s.type === '吉神' ? 'text-green-700' : 'text-red-600'}`}>{s.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{s.pos}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: 详细解读 */}
          {activeTab === 1 && (
            <div className="space-y-4">
              {/* 用神喜忌 */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-red-700 rounded-full" />
                  用神喜忌分析
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  八字木旺土弱，七杀透干。需<span className="font-bold text-red-700">火</span>来化解木杀、生扶日主。
                  丙火偏印透月干，为有力之印星，可化杀生身。
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 mb-1">用神</div>
                    <div className="text-lg font-bold">火</div>
                    <div className="text-xs mt-1">化杀生身</div>
                  </div>
                  <div className="bg-green-50 border border-green-100 text-green-700 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 mb-1">喜神</div>
                    <div className="text-lg font-bold">土</div>
                    <div className="text-xs mt-1">帮身抗杀</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 mb-1">忌神</div>
                    <div className="text-lg font-bold">木</div>
                    <div className="text-xs mt-1">克身太过</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 text-gray-500 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-400 mb-1">仇神</div>
                    <div className="text-lg font-bold">水</div>
                    <div className="text-xs mt-1">生木助杀</div>
                  </div>
                </div>
              </div>

              {/* 性格特点 + 事业财运 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-700 rounded-full" />
                    性格特点
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">●</span>
                      <span className="text-gray-600">诚实守信，待人厚道，值得信赖</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">●</span>
                      <span className="text-gray-600">意志坚定，不怕困难，有耐力</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">●</span>
                      <span className="text-gray-600">聪明好学，悟性高（偏印透干）</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-amber-500 mt-0.5">●</span>
                      <span className="text-gray-600">略显固执，不善变通（土性重）</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-amber-500 mt-0.5">●</span>
                      <span className="text-gray-600">内心敏感，不善表达（七杀克身）</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-0.5">●</span>
                      <span className="text-gray-600">需防过于保守，错失良机</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-700 rounded-full" />
                    事业财运
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div>
                      <span className="font-bold text-gray-700">适合行业：</span>
                      <span>文化教育、宗教玄学、心理咨询（偏印为用）</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">财星分析：</span>
                      <span>时柱庚申食神生财，晚年财运佳。壬水偏财藏于申中，有意外之财。</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">事业方向：</span>
                      <span>适合自主创业，33-42岁为人生黄金期，宜积极拓展。</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">财运特点：</span>
                      <span>食神生财，财源稳定。但七杀克身，需防破财。</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 婚姻感情 + 健康 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-700 rounded-full" />
                    婚姻感情
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div>
                      <span className="font-bold text-gray-700">日支为正印：</span>
                      <span>配偶温柔体贴，有母性光辉。婚姻和谐，能得到配偶帮助。</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">七杀透年：</span>
                      <span>早年感情波折，宜晚婚（28岁后为宜）。</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700">合婚建议：</span>
                      <span>宜配火土旺者，忌配木旺者。</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-700 rounded-full" />
                    健康提示
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">●</span>
                      <span>木旺克土，注意脾胃消化系统</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">●</span>
                      <span>火炎土燥，注意心血管</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">●</span>
                      <span>午火为用，宜南方发展</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">●</span>
                      <span>红色、紫色为幸运色</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 十神关系表 */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-red-700 rounded-full" />
                  十神关系
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {shishenRelations.map((s, i) => (
                    <div key={i} className="bg-gray-50/50 rounded-lg p-2.5 border border-gray-100">
                      <div className="text-xs font-bold text-gray-700">{s.name}</div>
                      <div className="text-xs text-red-600 mt-0.5">{s.gan}</div>
                      <div className="text-xs text-gray-500 mt-1 leading-snug">{s.trait}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: 深度分析 */}
          {activeTab === 2 && (
            <div className="space-y-4">
              {/* 大运详析 */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-red-700 rounded-full" />
                  大运详析
                </h4>
                <div className="space-y-4">
                  {mockBazi.dayun.map((dy, i) => (
                    <div key={i} className={`flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 ${i === 3 ? 'bg-red-50/20 -mx-2 px-2 rounded' : ''}`}>
                      <div className="bg-gradient-to-b from-amber-50 to-white border border-amber-200 rounded-lg px-3 py-2 text-center min-w-[90px]">
                        <div className="text-xs text-gray-400">{dy.age}岁</div>
                        <div className="text-xl font-bold font-kai text-amber-700 mt-0.5">{dy.gan}{dy.zhi}</div>
                        <div className="text-xs text-gray-400">{dy.nayin}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-700 mb-1">
                          {i === 0 && '少年求学运'}
                          {i === 1 && '青年成长运'}
                          {i === 2 && '青年事业运'}
                          {i === 3 && '中壮年高峰运 ★'}
                          {i === 4 && '中晚年安稳运'}
                          {i === 5 && '晚年富贵运'}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{dy.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 流年分析 */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-red-700 rounded-full" />
                  近年流年运势
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { year: '2024甲辰', fortune: '偏财', desc: '甲木七杀透干，压力较大。辰土蓄水帮身，有贵人相助。宜守不宜攻。' },
                    { year: '2025乙巳', fortune: '正官', desc: '乙木正官合身，巳火生土。事业有转机，宜把握机会。名利可期。' },
                    { year: '2026丙午', fortune: '偏印', desc: '丙午火旺，印星生身。学业有成，智慧开启。宜进修学习。' },
                  ].map((y, i) => (
                    <div key={i} className="bg-gradient-to-b from-amber-50/30 to-white border border-amber-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-700">{y.year}</span>
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">{y.fortune}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{y.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 格局深度 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-700 rounded-full" />
                    杀印相生
                  </h4>
                  <div className="text-sm text-gray-600 leading-relaxed space-y-2">
                    <p>七杀甲木透年干，丙火偏印透月干。杀生印，印生身，形成杀印相生。</p>
                    <p>此格局主人聪明睿智，有领导才能。化杀为权，能在压力中成长。</p>
                    <p>适合从事管理、策划、咨询类工作。能在困难中找到机会。</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-700 rounded-full" />
                    食神制杀
                  </h4>
                  <div className="text-sm text-gray-600 leading-relaxed space-y-2">
                    <p>时柱庚申食神，克制年干甲木七杀。食神制杀，化暴为顺。</p>
                    <p>此格局主人有才华，能以柔克刚。文武双全，有谋略有执行力。</p>
                    <p>食神制杀不宜过旺，需平衡。逢印星运更佳。</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === 底部 === */}
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            ※ 命理分析仅供参考娱乐，不构成任何决策建议
          </p>
          <button className="px-5 py-2 bg-gradient-to-r from-red-700 to-amber-700 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
            获取完整深度解读 →
          </button>
        </div>
          </>
        )}

      </div>
    </div>
  );
}
