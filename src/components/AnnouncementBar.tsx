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
 * 居中弹窗公告（多公告队列版）
 *
 * 行为：
 * - 拉取所有启用公告，按 sortOrder, createdAt 升序
 * - 过滤掉 localStorage 中已读的公告
 * - 未读公告逐条居中弹出：显示当前条 → 用户关闭/点击后 → 延迟显示下一条未读
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={dismiss}
        style={{ animation: 'annFadeIn 0.3s ease-out' }}
      />

      {/* 卡片 */}
      <div
        key={current.id}
        className="relative w-full max-w-[380px] max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#14141c] to-[#0a0a0f] shadow-2xl"
        style={{ animation: 'annScaleIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* 顶部 banner */}
        <div
          className="relative flex h-24 items-center justify-center border-b border-amber-500/20"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(212,145,106,0.3) 0%, transparent 70%), linear-gradient(135deg, #2a1a14 0%, #14141c 100%)',
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
            style={{
              background: 'linear-gradient(135deg, #D4916A, #b8704f)',
              boxShadow: '0 0 30px rgba(212,145,106,0.5)',
            }}
          >
            {current.icon}
          </div>
          {/* 关闭按钮 */}
          <button
            onClick={dismiss}
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-sm text-white/60 hover:text-white"
            aria-label="关闭"
          >
            ×
          </button>
          {/* 队列指示器 */}
          {queue.length > 1 && (
            <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/60">
              {idx + 1} / {queue.length}
            </span>
          )}
        </div>

        {/* 内容区 */}
        <div className="px-5 py-5">
          {/* 标签 */}
          <div className="mb-3 flex justify-center">
            <span
              className="rounded px-2 py-0.5 text-[11px] font-medium tracking-wide"
              style={{
                background: 'rgba(212,145,106,0.12)',
                color: '#E8B589',
              }}
            >
              {current.badge}
            </span>
          </div>

          {/* 标题 */}
          <h3
            className="mb-1 text-center text-lg font-bold tracking-wide"
            style={{
              fontFamily: "'KaiTi', 'STKaiti', '楷体', serif",
              color: '#E8B589',
            }}
          >
            {current.title}
          </h3>

          {/* 内容 */}
          <p className="mb-5 text-center text-sm leading-relaxed text-gray-300">
            {current.content}
          </p>

          {/* 按钮 */}
          <div className="flex gap-2">
            {current.link && (
              <Link
                href={current.link}
                onClick={dismiss}
                className="flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition"
                style={{
                  background: 'linear-gradient(135deg, #D4916A, #b8704f)',
                  color: '#1a0f08',
                  boxShadow: '0 4px 14px rgba(212,145,106,0.3)',
                }}
              >
                {current.linkText}
              </Link>
            )}
            <button
              onClick={dismiss}
              className="rounded-lg border border-amber-500/30 px-5 py-2.5 text-sm text-amber-300 transition hover:bg-amber-500/10"
            >
              知道了
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes annFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes annScaleIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
