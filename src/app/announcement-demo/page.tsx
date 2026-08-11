'use client';

import { useState, useEffect } from 'react';

/**
 * 公告形式 Demo — 对比 4 种公告展示方式
 * 1. 顶部横幅（固定条带）
 * 2. 滚动公告（文字水平滚动）
 * 3. 右下角浮层（卡片滑入）
 * 4. 模态弹窗（居中遮罩）
 */

export default function AnnouncementDemoPage() {
  const [showTopBar, setShowTopBar] = useState(false);
  const [showMarquee, setShowMarquee] = useState(false);
  const [showFloating, setShowFloating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [closedTopBar, setClosedTopBar] = useState(false);
  const [closedMarquee, setClosedMarquee] = useState(false);
  const [closedFloating, setClosedFloating] = useState(false);

  // 首次进入自动展示一次
  useEffect(() => {
    const seen = sessionStorage.getItem('announcement-demo-seen');
    if (!seen) {
      setTimeout(() => setShowFloating(true), 1500);
      sessionStorage.setItem('announcement-demo-seen', '1');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 形式1：顶部横幅 */}
      {showTopBar && !closedTopBar && (
        <div className="fixed top-0 left-0 right-0 z-[300] bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white shadow-lg animate-[slideDown_0.4s_ease-out]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xl">📢</span>
              <div className="flex-1">
                <span className="font-semibold text-sm">🎉 知微阁全新上线紫微斗数排盘功能</span>
                <span className="text-amber-100 text-sm ml-2 hidden sm:inline">— 三视图切换，飞星/三合/四化一目了然</span>
              </div>
              <a href="/ziwei" className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition whitespace-nowrap">
                立即体验 →
              </a>
            </div>
            <button
              onClick={() => setClosedTopBar(true)}
              className="text-white/70 hover:text-white text-xl leading-none px-1"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 形式2：滚动公告 */}
      {showMarquee && !closedMarquee && (
        <div className="fixed top-0 left-0 right-0 z-[300] bg-white border-b border-amber-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
            <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded font-medium whitespace-nowrap">📰 公告</span>
            <div className="flex-1 overflow-hidden">
              <div className="animate-[marquee_18s_linear_infinite] whitespace-nowrap text-sm text-gray-700">
                🔥 新用户注册即送 100 积分，可用于八字排盘、奇门遁甲等所有功能　　|　　✨ 紫微斗数排盘已上线，支持飞星/三合/四化三视图　　|　　🙏 在线供奉全新改版，新增 24 种供品　　|　　💎 会员限时 8 折，解锁全部高级解读
              </div>
            </div>
            <button
              onClick={() => setClosedMarquee(true)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 页面主体 */}
      <div className={`pt-16 pb-32 ${(showTopBar || showMarquee) && !closedTopBar && !closedMarquee ? 'pt-24' : ''}`}>
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-8">公告形式对比 Demo</h1>
          <p className="text-gray-500 mb-10">点击下方按钮，体验 4 种不同的首页公告展示方式</p>

          {/* 按钮区 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            <button
              onClick={() => { setShowTopBar(true); setClosedTopBar(false); }}
              className="p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-amber-400 hover:shadow-md transition text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📊</span>
                <span className="font-semibold text-gray-900 group-hover:text-amber-600">形式一：顶部横幅</span>
              </div>
              <p className="text-sm text-gray-500">页面顶部固定条带，渐变背景，文字+按钮+关闭。适合重要公告，视觉醒目但不遮挡内容。</p>
            </button>

            <button
              onClick={() => { setShowMarquee(true); setClosedMarquee(false); }}
              className="p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-amber-400 hover:shadow-md transition text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📜</span>
                <span className="font-semibold text-gray-900 group-hover:text-amber-600">形式二：滚动公告</span>
              </div>
              <p className="text-sm text-gray-500">多条公告水平滚动播放，节省空间。适合信息量多、非紧急的公告轮播展示。</p>
            </button>

            <button
              onClick={() => setShowFloating(true)}
              className="p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-amber-400 hover:shadow-md transition text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💬</span>
                <span className="font-semibold text-gray-900 group-hover:text-amber-600">形式三：右下角浮层</span>
              </div>
              <p className="text-sm text-gray-500">右下角卡片滑入，轻量不打扰。适合新功能提醒、活动通知，用户可自行关闭。</p>
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="p-5 bg-white border-2 border-gray-200 rounded-xl hover:border-amber-400 hover:shadow-md transition text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🪟</span>
                <span className="font-semibold text-gray-900 group-hover:text-amber-600">形式四：模态弹窗</span>
              </div>
              <p className="text-sm text-gray-500">居中遮罩弹窗，强制关注。适合重大活动、首次访问引导，视觉冲击力最强。</p>
            </button>
          </div>

          {/* 对比表格 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-700">对比项</th>
                  <th className="text-center p-3 font-semibold text-amber-600">顶部横幅</th>
                  <th className="text-center p-3 font-semibold text-amber-600">滚动公告</th>
                  <th className="text-center p-3 font-semibold text-amber-600">右下角浮层</th>
                  <th className="text-center p-3 font-semibold text-amber-600">模态弹窗</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-3 text-gray-600 font-medium">视觉冲击力</td>
                  <td className="p-3 text-center">★★★★☆</td>
                  <td className="p-3 text-center">★★★☆☆</td>
                  <td className="p-3 text-center">★★☆☆☆</td>
                  <td className="p-3 text-center">★★★★★</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-600 font-medium">打扰程度</td>
                  <td className="p-3 text-center text-green-600">低</td>
                  <td className="p-3 text-center text-green-600">低</td>
                  <td className="p-3 text-center text-green-600">极低</td>
                  <td className="p-3 text-center text-red-500">高</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-600 font-medium">信息容量</td>
                  <td className="p-3 text-center">中（1条）</td>
                  <td className="p-3 text-center">高（多条）</td>
                  <td className="p-3 text-center">中（1条）</td>
                  <td className="p-3 text-center">高（富文本）</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-600 font-medium">适合场景</td>
                  <td className="p-3 text-center text-xs">重要公告</td>
                  <td className="p-3 text-center text-xs">多条轮播</td>
                  <td className="p-3 text-center text-xs">功能提醒</td>
                  <td className="p-3 text-center text-xs">重大活动</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 形式3：右下角浮层 */}
      {showFloating && !closedFloating && (
        <div className="fixed bottom-6 right-6 z-[300] w-80 bg-white rounded-xl shadow-2xl border border-amber-200 overflow-hidden animate-[slideInRight_0.4s_ease-out]">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <span className="text-lg">✨</span>
              <span className="font-semibold text-sm">新功能上线</span>
            </div>
            <button
              onClick={() => setClosedFloating(true)}
              className="text-white/70 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1">紫微斗数排盘已上线</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-3">
              支持飞星、三合、四化三视图切换，命盘高清展示，时间轴本命/大限/流年/流月全覆盖。
            </p>
            <div className="flex gap-2">
              <a href="/ziwei" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-center py-2 rounded-lg text-sm font-medium transition">
                立即体验
              </a>
              <button
                onClick={() => setClosedFloating(true)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
              >
                稍后
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 形式4：模态弹窗 */}
      {showModal && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-[scaleIn_0.3s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative h-32 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-5xl">🎉</span>
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 text-white/70 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">知微阁 · 周年庆典</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                全新紫微斗数排盘上线，支持三视图切换。会员限时 8 折，新用户注册即送 100 积分。快来体验更精准的命理推演！
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-medium transition"
                >
                  立即查看
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
