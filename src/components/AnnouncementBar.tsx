'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AnnouncementConfig {
  enabled: boolean;
  icon: string;
  badge: string;
  title: string;
  content: string;
  link: string;
  linkText: string;
  dismissHours: number;
}

const STORAGE_KEY = 'announcement_floating_dismissed_at';

/**
 * 右下角公告浮层
 * 从 /api/announcement 读取配置，关闭后 N 小时内不再弹出
 */
export default function AnnouncementBar() {
  const [config, setConfig] = useState<AnnouncementConfig | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch('/api/announcement')
      .then(r => r.json())
      .then(data => {
        if (data.announcement) setConfig(data.announcement);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!config) return;

    // 检查是否在关闭记忆期内
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const hours = (Date.now() - parseInt(dismissedAt)) / 3600000;
      if (hours < config.dismissHours) return;
    }

    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [config]);

  const handleClose = () => {
    setShow(false);
    if (config) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
  };

  if (!config || !show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[300] w-80 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border border-amber-200 overflow-hidden animate-[slideInRight_0.4s_ease-out]">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <span className="text-base">{config.icon}</span>
          <span className="font-semibold text-sm">{config.badge}</span>
        </div>
        <button
          onClick={handleClose}
          className="text-white/70 hover:text-white text-lg leading-none"
          aria-label="关闭"
        >
          ×
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">{config.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">{config.content}</p>
        <div className="flex gap-2">
          {config.link && (
            <Link
              href={config.link}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-center py-2 rounded-lg text-sm font-medium transition"
            >
              {config.linkText}
            </Link>
          )}
          <button
            onClick={handleClose}
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
