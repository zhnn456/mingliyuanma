'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-client';

// === 类型定义 ===
interface CardKey {
  id: string;
  code: string;
  type: string;
  value: number;
  price: number;
  status: string;
  batchId: string;
  expiryAt: string | null;
  createdAt: string;
  usedAt: string | null;
  usedByEmail: string | null;
  usedByName: string | null;
  createdByEmail: string | null;
}

interface Stats {
  total: number;
  unused: number;
  used: number;
  disabled: number;
  expired: number;
}

interface Batch {
  batchId: string;
  count: number;
  createdAt: string;
  expiryAt: string | null;
}

const TYPE_MAP: Record<string, string> = {
  lingzhu: '积分卡',
  agent_balance: '代理商余额卡',
};

const STATUS_MAP: Record<string, string> = {
  unused: '未使用',
  used: '已使用',
  expired: '已过期',
  disabled: '已禁用',
};

const STATUS_COLOR: Record<string, string> = {
  unused: 'bg-green-100 text-green-800',
  used: 'bg-gray-100 text-gray-600',
  expired: 'bg-orange-100 text-orange-800',
  disabled: 'bg-red-100 text-red-800',
};

// 计算剩余天数
function getRemainingDays(expiryAt: string | null): number | null {
  if (!expiryAt) return null;
  const diff = new Date(expiryAt).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

// 格式化日期
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminCardKeysPage() {
  const { user: session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardKey[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, unused: 0, used: 0, disabled: 0, expired: 0 });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // 筛选
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBatch, setFilterBatch] = useState('');

  // 生成表单
  const [form, setForm] = useState({
    count: 10,
    type: 'lingzhu',
    value: 100,
    price: 9.9,
    expiryDays: 30,
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<CardKey[] | null>(null);
  const [copied, setCopied] = useState(false);

  // 获取卡密列表
  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      if (filterBatch) params.set('batchId', filterBatch);

      const res = await fetch(`/api/admin/card-keys?${params}`);
      if (res.ok) {
        const d = await res.json();
        setCards(d.rows || []);
        setStats(d.stats || { total: 0, unused: 0, used: 0, disabled: 0, expired: 0 });
        setBatches(d.batches || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
      }
    } catch (e) {
      console.error('获取卡密列表失败', e);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType, filterBatch]);

  useEffect(() => {
    if (session?.role === 'admin') {
      fetchCards();
    }
  }, [fetchCards, session]);

  // 生成卡密
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/card-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setGenerated(d.items || []);
        // === 关键：await 确保统计刷新 ===
        await fetchCards();
      } else {
        alert(d.error || '生成失败');
      }
    } catch (e) {
      alert('网络错误');
    } finally {
      setGenerating(false);
    }
  };

  // 复制全部
  const handleCopy = () => {
    if (!generated) return;
    const text = generated.map(c => c.code).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 导出当前筛选的卡密
  const handleExport = async () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('pageSize', '10000');
    if (filterStatus) params.set('status', filterStatus);
    if (filterType) params.set('type', filterType);
    if (filterBatch) params.set('batchId', filterBatch);

    const res = await fetch(`/api/admin/card-keys?${params}`);
    const d = await res.json();
    const rows = d.rows || [];

    const lines = ['卡密码\t类型\t面值\t售价\t状态\t使用者\t过期时间\t剩余天数\t创建时间'];
    rows.forEach((c: CardKey) => {
      const remain = getRemainingDays(c.expiryAt);
      lines.push([
        c.code,
        TYPE_MAP[c.type] || c.type,
        c.value,
        c.price,
        STATUS_MAP[c.status] || c.status,
        c.usedByEmail || '-',
        c.expiryAt ? formatDate(c.expiryAt) : '永久',
        remain !== null ? (remain > 0 ? `${remain}天` : '已过期') : '永久',
        formatDate(c.createdAt),
      ].join('\t'));
    });

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `卡密列表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 禁用卡密
  const handleDisable = async (id: string) => {
    if (!confirm('确定要禁用这张卡密吗？')) return;
    try {
      const res = await fetch(`/api/admin/card-keys?id=${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (res.ok && d.success) {
        await fetchCards();
      } else {
        alert(d.error || '禁用失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  // 纯卡密码（一行一个，方便复制粘贴）
  const exportText = () => {
    if (!generated || generated.length === 0) return '';
    return generated.map(c => c.code).join('\n');
  };

  // 统计卡片
  const statCards = [
    { label: '总卡密', value: stats.total, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: '未使用', value: stats.unused, color: 'bg-green-50 text-green-700 border-green-200' },
    { label: '已使用', value: stats.used, color: 'bg-gray-50 text-gray-700 border-gray-200' },
    { label: '已过期', value: stats.expired, color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { label: '已禁用', value: stats.disabled, color: 'bg-red-50 text-red-700 border-red-200' },
  ];

  if (session?.role !== 'admin') {
    return <div className="p-8 text-center text-gray-500">无权限访问</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">卡密管理</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 生成卡密 */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">生成卡密</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500">数量</label>
            <input type="number" value={form.count} min={1} max={500}
              onChange={e => setForm({ ...form, count: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">类型</label>
            <select value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="lingzhu">积分卡</option>
              <option value="agent_balance">代理商余额卡</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">面值</label>
            <input type="number" value={form.value} min={1}
              onChange={e => setForm({ ...form, value: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">售价</label>
            <input type="number" value={form.price} min={0} step={0.1}
              onChange={e => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">有效期(天)</label>
            <input type="number" value={form.expiryDays} min={0}
              onChange={e => setForm({ ...form, expiryDays: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          {generating ? '生成中...' : '生成卡密'}
        </button>
      </div>

      {/* 生成结果 */}
      {generated && generated.length > 0 && (
        <div className="bg-white rounded-xl border p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">生成结果（{generated.length} 张）</h3>
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">
                {copied ? '✓ 已复制' : '复制全部'}
              </button>
              <button onClick={() => setGenerated(null)}
                className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                关闭
              </button>
            </div>
          </div>

          {/* 纯卡密码区（方便复制粘贴） */}
          <div className="text-xs text-gray-500 mb-1">纯卡密码（点击全选复制，一行一个）：</div>
          <textarea readOnly value={exportText()}
            className="w-full h-40 px-3 py-2 border rounded-lg text-sm font-mono bg-gray-50"
            onClick={e => (e.target as HTMLTextAreaElement).select()} />

          {/* 带状态核对列表 */}
          <div className="text-xs text-gray-500 mt-4 mb-1">核对列表（含状态）：</div>
          <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            {generated.map((c, i) => (
              <div key={c.id} className={`flex items-center justify-between px-3 py-2 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs w-6">{i + 1}</span>
                  <span className="font-mono font-bold text-gray-900">{c.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">
                    {STATUS_MAP[c.status] || c.status}
                  </span>
                  <button onClick={() => {
                    navigator.clipboard.writeText(c.code);
                    const btn = document.getElementById(`copy-btn-${i}`);
                    if (btn) { btn.textContent = '✓'; setTimeout(() => { if (btn) btn.textContent = '复制'; }, 1500); }
                  }} id={`copy-btn-${i}`} className="text-xs text-blue-600 hover:text-blue-800">复制</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 筛选区 */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">全部状态</option>
            <option value="unused">未使用</option>
            <option value="used">已使用</option>
            <option value="expired">已过期</option>
            <option value="disabled">已禁用</option>
          </select>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">全部类型</option>
            <option value="lingzhu">积分卡</option>
            <option value="agent_balance">代理商余额卡</option>
          </select>
          <select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">全部批次</option>
            {batches.map(b => (
              <option key={b.batchId} value={b.batchId}>
                {b.batchId.slice(0, 20)}... ({b.count}张, {formatDate(b.createdAt)})
              </option>
            ))}
          </select>
          <button onClick={handleExport}
            className="px-3 py-1.5 border rounded-lg text-sm text-blue-600 hover:bg-blue-50">
            导出 CSV
          </button>
          <span className="text-xs text-gray-400 ml-auto">共 {total} 条</span>
        </div>
      </div>

      {/* 卡密列表 */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">卡密码</th>
                <th className="px-3 py-2 text-left">类型</th>
                <th className="px-3 py-2 text-right">面值</th>
                <th className="px-3 py-2 text-left">状态</th>
                <th className="px-3 py-2 text-left">使用者</th>
                <th className="px-3 py-2 text-left">过期/剩余</th>
                <th className="px-3 py-2 text-left">创建时间</th>
                <th className="px-3 py-2 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">加载中...</td></tr>
              ) : cards.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">暂无卡密</td></tr>
              ) : (
                cards.map(c => {
                  const remain = getRemainingDays(c.expiryAt);
                  return (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono font-bold text-gray-900">{c.code}</td>
                      <td className="px-3 py-2">{TYPE_MAP[c.type] || c.type}</td>
                      <td className="px-3 py-2 text-right">
                        {c.type === 'lingzhu' ? `${c.value}积分` : `¥${c.value}`}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[c.status] || 'bg-gray-100'}`}>
                          {STATUS_MAP[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {c.usedByEmail || '-'}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {c.expiryAt ? (
                          <div>
                            <div className="text-gray-500">{formatDate(c.expiryAt)}</div>
                            <div className={remain > 7 ? 'text-green-600' : remain > 0 ? 'text-orange-600' : 'text-red-600'}>
                              {remain > 0 ? `剩${remain}天` : '已过期'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">永久</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">{formatDate(c.createdAt)}</td>
                      <td className="px-3 py-2 text-center">
                        {(c.status === 'unused') && (
                          <button onClick={() => handleDisable(c.id)}
                            className="text-xs text-red-600 hover:text-red-800">禁用</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-xs text-gray-500">
              第 {page} / {totalPages} 页
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1}
                className="px-3 py-1 border rounded text-xs disabled:opacity-30">首页</button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 border rounded text-xs disabled:opacity-30">上一页</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 border rounded text-xs disabled:opacity-30">下一页</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                className="px-3 py-1 border rounded text-xs disabled:opacity-30">末页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
