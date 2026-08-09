'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Announcement {
  id: string;
  icon: string;
  badge: string;
  title: string;
  content: string;
  link: string;
  linkText: string;
  sortOrder: number;
}

const READ_KEY = 'announcement_read_ids';

/** 读取已读公告 ID 列表 */
function getReadIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** 标记某条公告为已读 */
function markRead(id: string) {
  try {
    const ids = getReadIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(READ_KEY, JSON.stringify(ids));
    }
  } catch {
    // localStorage 不可用，静默
  }
}

/**
 * 右下角公告浮层（多公告队列版）
 *
 * 行为：
 * - 拉取所有启用公告，按 sortOrder, createdAt 升序
 * - 过滤掉 localStorage 中已读的公告
 * - 未读公告逐条弹出：显示当前条 → 用户关闭/点击后 → 延迟显示下一条未读
 * - 显示即标记已读，刷新后不再打扰
 * - 管理员新增公告后，新公告会再次弹出（其 id 不在已读列表）
 */
export default function AnnouncementBar() {
  const [queue, setQueue] = useState<Announcement[]>([]);
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);

  const current = queue[idx];

  useEffect(() => {
    let mounted = true;
    fetch('/api/announcement')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        const list: Announcement[] = Array.isArray(data.announcements)
          ? data.announcements
          : [];
        if (list.length === 0) return;
        const readIds = getReadIds();
        const unread = list.filter(a => !readIds.includes(a.id));
        if (unread.length === 0) return;
        setQueue(unread);
        // 2 秒后弹出第一条
        setTimeout(() => mounted && setShown(true), 2000);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // 显示当前公告时立即标记已读（避免刷新重复打扰）
  useEffect(() => {
    if (shown && current) {
      markRead(current.id);
    }
  }, [shown, current?.id]);

  const dismiss = useCallback(() => {
    setShown(false);
    // 若还有未读，延迟显示下一条
    setIdx(prev => {
      const next = prev + 1;
      if (next < queue.length) {
        setTimeout(() => setShown(true), 1200);
      }
      return next;
    });
  }, [queue.length]);

  if (!current || !shown) return null;

  return (
    <div
      key={current.id}
      className="fixed bottom-6 right-6 z-[300] w-80 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border border-amber-200 overflow-hidden animate-[slideInRight_0.4s_ease-out]"
    >
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <span className="text-base">{current.icon}</span>
          <span className="font-semibold text-sm">{current.badge}</span>
        </div>
        <button
          onClick={dismiss}
          className="text-white/70 hover:text-white text-lg leading-none"
          aria-label="关闭"
        >
          ×
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
          {current.title}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          {current.content}
        </p>
        <div className="flex gap-2">
          {current.link && (
            <Link
              href={current.link}
              onClick={dismiss}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-center py-2 rounded-lg text-sm font-medium transition"
            >
              {current.linkText}
            </Link>
          )}
          <button
            onClick={dismiss}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            稍后
          </button>
        </div>
      </div>
      {/* 队列指示器 */}
      {queue.length > 1 && (
        <div className="absolute top-1 right-8 text-[10px] text-white/60">
          {idx + 1}/{queue.length}
        </div>
      )}
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
