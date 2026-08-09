'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * 右下角公告浮层
 * 首次访问延迟 2 秒弹出，关闭后 localStorage 记忆不再显示
 */
export default function AnnouncementBar() {
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('announcement_floating_closed');
    if (!dismissed) {
      const timer = setTimeout(() => setShowFloating(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeFloating = () => {
    setShowFloating(false);
    localStorage.setItem('announcement_floating_closed', '1');
  };

  if (!showFloating) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[300] w-80 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border border-amber-200 overflow-hidden animate-[slideInRight_0.4s_ease-out]">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <span className="text-base">🎁</span>
          <span className="font-semibold text-sm">新用户福利</span>
        </div>
        <button
          onClick={closeFloating}
          className="text-white/70 hover:text-white text-lg leading-none"
          aria-label="关闭"
        >
          ×
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">注册即送 100 灵珠</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          灵珠可用于八字排盘、奇门遁甲、紫微斗数等全部功能，免费体验专业命理测算。
        </p>
        <div className="flex gap-2">
          <Link
            href="/register"
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-center py-2 rounded-lg text-sm font-medium transition"
          >
            立即注册
          </Link>
          <button
            onClick={closeFloating}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            稍后
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
