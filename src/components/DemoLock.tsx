'use client';

import { useEffect, useRef } from 'react';

/**
 * 演示账号全局锁组件
 *
 * 在 demo 账号下激活，监听 DOM 变化，把所有"写操作"按钮锁定：
 * - 按钮置灰 + 加锁图标 + 禁用点击
 * - 识别按钮文案关键词：创建/新增/删除/编辑/保存/修改/生成/续费/发布/导出/审核/通过/拒绝/上架/下架/启用/停用/重置/吊销/冻结/解冻/打款/撤销/确认/提交/发送/分配/绑定/解绑
 * - 同时锁定 type=submit 的按钮
 * - 通过事件拦截（capture 阶段阻止 click）+ 视觉置灰实现
 */

// 写操作关键词（匹配按钮文字）
const WRITE_KEYWORDS = [
  '创建', '新增', '添加', '删除', '移除', '编辑', '修改', '保存', '确认保存',
  '生成', '重新生成', '续费', '续期', '发布', '上架', '下架', '导出', '下载',
  '审核', '通过', '拒绝', '驳回', '批准', '启用', '停用', '激活', '重置',
  '吊销', '冻结', '解冻', '打款', '撤销', '确认', '提交', '发送', '推送',
  '分配', '绑定', '解绑', '复制', '克隆', '升级', '回滚', '恢复', '清空',
  '应用', '更新', '充值', '扣减', '发放', '撤销', '关闭订单', '退款',
];

// 锁图标 SVG
const LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="demo-lock-icon" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;flex-shrink:0;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

function isWriteButton(el: HTMLElement): boolean {
  // 1. type=submit 的按钮
  if (el.tagName === 'BUTTON' && (el as HTMLButtonElement).type === 'submit') {
    return true;
  }
  // 2. 按钮文字命中关键词
  const text = (el.textContent || '').trim();
  if (!text) return false;
  return WRITE_KEYWORDS.some(kw => text.includes(kw));
}

function lockButton(el: HTMLElement) {
  if (el.dataset.demoLocked === '1') return;
  el.dataset.demoLocked = '1';
  el.setAttribute('disabled', 'disabled');
  el.setAttribute('aria-disabled', 'true');
  el.style.cursor = 'not-allowed';
  el.style.opacity = '0.45';
  el.style.pointerEvents = 'none';
  el.classList.add('demo-locked-btn');

  // 前置插入锁图标（避免覆盖原内容）
  if (!el.querySelector('.demo-lock-icon')) {
    const span = document.createElement('span');
    span.innerHTML = LOCK_SVG;
    el.insertBefore(span, el.firstChild);
  }
}

function unlockButton(el: HTMLElement) {
  if (el.dataset.demoLocked !== '1') return;
  delete el.dataset.demoLocked;
  el.removeAttribute('disabled');
  el.removeAttribute('aria-disabled');
  el.style.cursor = '';
  el.style.opacity = '';
  el.style.pointerEvents = '';
  el.classList.remove('demo-locked-btn');
  const icon = el.querySelector('.demo-lock-icon');
  if (icon && icon.parentElement) {
    icon.parentElement.remove();
  }
}

function processAll(root: Node) {
  // 只处理元素节点
  if (root.nodeType !== 1 && root.nodeType !== 9) return;
  const rootEl = root as Element;

  // 处理所有按钮和可点击元素
  const candidates = rootEl.querySelectorAll
    ? rootEl.querySelectorAll('button, [role="button"], a.btn, a[class*="button"], [class*="cursor-pointer"]')
    : [];

  candidates.forEach((el) => {
    const htmlEl = el as HTMLElement;
    // 排除：返回、取消、关闭、查看、详情、搜索等读操作
    const text = (htmlEl.textContent || '').trim();
    const readOnlyKeywords = ['返回', '取消', '关闭', '查看', '详情', '搜索', '筛选', '上一页', '下一页', '导出记录查看', '刷新', '退出', '登录', '登出'];
    if (readOnlyKeywords.some(kw => text === kw || text.startsWith(kw + ' '))) {
      return;
    }
    if (isWriteButton(htmlEl)) {
      lockButton(htmlEl);
    }
  });
}

export default function DemoLock() {
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // 注入全局样式（横幅 + 锁按钮 hover 提示）
    const style = document.createElement('style');
    style.textContent = `
      .demo-locked-btn { position: relative; }
      .demo-locked-btn:hover::after {
        content: "演示账号无权操作";
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #1f2937;
        color: #fff;
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 4px;
        white-space: nowrap;
        z-index: 9999;
        margin-top: 4px;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    // 初次处理
    processAll(document.body);

    // 监听 DOM 变化
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            processAll(node);
            // 处理子节点
            processAll(node as Element);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      style.remove();
    };
  }, []);

  return null;
}
