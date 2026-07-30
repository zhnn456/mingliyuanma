'use client';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  module?: string;
}

/**
 * Shared placeholder for admin pages that have been planned but not yet implemented.
 * Shows a clean "coming soon" state with module context.
 */
export default function PlaceholderPage({ title, description, module }: PlaceholderPageProps) {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="text-[13px] text-slate-500 mt-1">{description || `${module || '该模块'}已纳入规划，功能开发中`}</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="py-16 px-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 text-mingli-400 opacity-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M12 2v6" />
              <path d="m12 8-4 4h8z" />
              <path d="M8 12v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-8" />
              <path d="M9 17h6" />
            </svg>
          </div>
          <div className="text-[18px] font-semibold text-slate-900">该页面功能开发中</div>
          <div className="text-[13px] text-slate-500 mt-2 max-w-md mx-auto">
            此模块已包含在管理后台 v2.0 的规划中，高保真设计稿可在 Canvas 设计工作区中查看。已完成的功能页面可在侧边栏中点击查看。
          </div>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-50 text-[12px] text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
            模块: {module || title}
          </div>
        </div>
      </div>
    </div>
  );
}
