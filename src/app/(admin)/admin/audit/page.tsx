'use client';

import { useState, useEffect, useCallback } from 'react';

type AuditAction =
  | 'login' | 'logout' | 'register'
  | 'bazi_paipan' | 'ziwei_paipan' | 'qimen_paipan' | 'meihua_paipan'
  | 'order_create' | 'order_pay' | 'order_refund'
  | 'member_upgrade' | 'member_expire'
  | 'admin_update_user' | 'admin_update_order' | 'admin_update_config'
  | 'admin_toggle_agent' | 'admin_create_agent'
  | 'agent_login' | 'agent_update_customer'
  | 'pdf_generate' | 'pdf_download'
  | 'offering_create'
  | 'security_violation' | 'rate_limit_hit';

interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction;
  ip: string | null;
  userAgent: string | null;
  details: Record<string, any> | null;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
}

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: 'login', label: '登录' },
  { value: 'logout', label: '登出' },
  { value: 'register', label: '注册' },
  { value: 'bazi_paipan', label: '八字排盘' },
  { value: 'ziwei_paipan', label: '紫微排盘' },
  { value: 'qimen_paipan', label: '奇门排盘' },
  { value: 'meihua_paipan', label: '梅花排盘' },
  { value: 'order_create', label: '创建订单' },
  { value: 'order_pay', label: '支付订单' },
  { value: 'order_refund', label: '退款' },
  { value: 'member_upgrade', label: '升级会员' },
  { value: 'member_expire', label: '会员过期' },
  { value: 'admin_update_user', label: '修改用户' },
  { value: 'admin_update_order', label: '修改订单' },
  { value: 'admin_update_config', label: '修改配置' },
  { value: 'admin_toggle_agent', label: '切换代理商' },
  { value: 'admin_create_agent', label: '创建代理商' },
  { value: 'agent_login', label: '代理商登录' },
  { value: 'agent_update_customer', label: '代理商更新客户' },
  { value: 'pdf_generate', label: '生成PDF' },
  { value: 'pdf_download', label: '下载PDF' },
  { value: 'offering_create', label: '创建供奉' },
  { value: 'security_violation', label: '安全违规' },
  { value: 'rate_limit_hit', label: '触发限流' },
];

const ACTION_LABEL_MAP: Record<string, string> = Object.fromEntries(
  ACTION_OPTIONS.map(o => [o.value, o.label])
);

const STATUS_OPTIONS = [
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
  { value: 'warning', label: '警告' },
];

const STATUS_LABEL_MAP: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map(o => [o.value, o.label])
);

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: 'bg-green-50 text-green-700 border-green-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[status] || styles.success}`}>
      {STATUS_LABEL_MAP[status] || status}
    </span>
  );
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [date, setDate] = useState('');
  const [action, setAction] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const pageSize = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        offset: String((page - 1) * pageSize),
        limit: String(pageSize),
      });
      if (date) params.set('date', date);
      if (action) params.set('action', action);
      if (status) params.set('status', status);

      const res = await fetch(`/api/admin/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [page, date, action, status]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleReset = () => {
    setDate('');
    setAction('');
    setStatus('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">审计日志</h2>
          <p className="text-sm text-gray-500">共 {total} 条记录</p>
        </div>
        <button
          onClick={async () => {
            if (!confirm('确认清理30天前的旧日志?')) return;
            try {
              const res = await fetch('/api/admin/audit', { method: 'DELETE' });
              if (res.ok) {
                const data = await res.json();
                alert(`已清理 ${data.deleted} 条旧日志`);
                fetchLogs();
              }
            } catch {}
          }}
          className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
        >
          清理旧日志
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">日期</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">操作类型</label>
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">全部</option>
            {ACTION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">状态</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">全部</option>
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">
          搜索
        </button>
        <button type="button" onClick={handleReset} className="px-5 py-2 border rounded-lg text-sm hover:bg-gray-50">
          重置
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">操作人</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作类型</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">IP地址</th>
              <th className="px-4 py-3 text-gray-500 font-medium">时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">加载中...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">暂无日志记录</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLog(log)}>
                  <td className="px-4 py-3 text-gray-900">{log.userId || '匿名'}</td>
                  <td className="px-4 py-3 text-gray-700">{ACTION_LABEL_MAP[log.action] || log.action}</td>
                  <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{log.ip || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          第 {page} / {totalPages || 1} 页
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            上一页
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">审计日志详情</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">操作人</div>
                  <div className="text-sm text-gray-900">{selectedLog.userId || '匿名'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">操作类型</div>
                  <div className="text-sm text-gray-900">{ACTION_LABEL_MAP[selectedLog.action] || selectedLog.action}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">状态</div>
                  <div><StatusBadge status={selectedLog.status} /></div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">时间</div>
                  <div className="text-sm text-gray-900">{selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString('zh-CN') : '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">IP地址</div>
                  <div className="text-sm text-gray-900">{selectedLog.ip || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">User Agent</div>
                  <div className="text-sm text-gray-900 truncate">{selectedLog.userAgent || '-'}</div>
                </div>
              </div>
              {selectedLog.details && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">详情</div>
                  <pre className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-700 overflow-auto whitespace-pre-wrap break-all">
                    {typeof selectedLog.details === 'string'
                      ? selectedLog.details
                      : JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}