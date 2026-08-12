'use client';

import { useState, useEffect } from 'react';

interface AgentLicense {
  id: string;
  agentId: string;
  licenseKey: string;
  domain: string | null;
  issuedAt: string;
  expiryAt: string;
  maxUsers: number;
  features: string;
  status: string;
  agentName?: string;
}

// 在授权码的分隔点后插入零宽空格，优先在 LIC/载荷/签名 边界换行，不影响复制内容
function formatLicenseKey(key: string): string {
  return key.replace(/\./g, '.\u200B');
}

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<AgentLicense[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editLicense, setEditLicense] = useState<AgentLicense | null>(null);
  const [toast, setToast] = useState('');
  const pageSize = 20;

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);
      if (searchKeyword) params.set('search', searchKeyword);
      const res = await fetch(`/api/admin/licenses?${params}`);
      if (res.ok) {
        const d = await res.json();
        setLicenses(d.licenses || []);
        setTotal(d.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchLicenses(); }, [page, statusFilter]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleCopy = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      showToast('已复制到剪贴板');
    } catch {
      showToast('复制失败');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('确定要撤销此授权码吗？')) return;
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showToast('已撤销');
        fetchLicenses();
      }
    } catch { showToast('操作失败'); }
  };

  const handleEditSave = async (data: { id: string; expiryAt?: string; maxUsers?: number }) => {
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        showToast('更新成功');
        setEditLicense(null);
        fetchLicenses();
      }
    } catch { showToast('更新失败'); }
  };

  const handleCreate = async (data: { agentId: string; domain?: string; durationDays: number; maxUsers: number; features: string[] }) => {
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const d = await res.json();
        showToast('创建成功：' + d.license?.licenseKey);
        setShowCreateModal(false);
        fetchLicenses();
      }
    } catch { showToast('创建失败'); }
  };

  const handleBatchCreate = async (data: { count: number; agentId: string; domain?: string; durationDays: number; maxUsers: number; features: string[] }) => {
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const d = await res.json();
        setShowBatchModal(false);
        fetchLicenses();
        if (d.keys && d.keys.length > 0) {
          showToast(`成功生成 ${d.count} 个授权码`);
          await navigator.clipboard.writeText(d.keys.join('\n'));
          showToast(`${d.count} 个授权码已复制到剪贴板`);
        }
      }
    } catch { showToast('批量生成失败'); }
  };

  const statusMap: Record<string, string> = { active: '有效', expired: '已过期', revoked: '已撤销' };
  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-yellow-100 text-yellow-800',
    revoked: 'bg-gray-100 text-gray-600',
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">授权码管理</h2>
            <p className="text-sm text-gray-500">共 {total} 个授权码</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              生成授权码
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              批量生成
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="搜索授权码/域名/代理商"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setPage(1); fetchLicenses(); } }}
            className="px-3 py-2 border rounded-lg text-sm flex-1 max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="active">有效</option>
            <option value="expired">已过期</option>
            <option value="revoked">已撤销</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="w-[28%] px-4 py-3 text-gray-500 font-medium">授权码</th>
              <th className="w-[11%] px-4 py-3 text-gray-500 font-medium">代理商</th>
              <th className="w-[14%] px-4 py-3 text-gray-500 font-medium">域名</th>
              <th className="w-[11%] px-4 py-3 text-gray-500 font-medium">有效期至</th>
              <th className="w-[8%] px-4 py-3 text-gray-500 font-medium">用户上限</th>
              <th className="w-[12%] px-4 py-3 text-gray-500 font-medium">功能</th>
              <th className="w-[7%] px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="w-[9%] px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : licenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">暂无授权码</td>
              </tr>
            ) : (
              licenses.map((lic) => (
                <tr key={lic.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-mono text-xs text-gray-700 break-all leading-relaxed">{formatLicenseKey(lic.licenseKey)}</span>
                      <button
                        onClick={() => handleCopy(lic.licenseKey)}
                        className="text-blue-600 text-xs hover:underline self-start"
                      >
                        复制
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">{lic.agentName || lic.agentId}</td>
                  <td className="px-4 py-3 text-gray-500">{lic.domain || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {lic.expiryAt ? new Date(lic.expiryAt).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="px-4 py-3">{lic.maxUsers}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {lic.features ? Object.keys(JSON.parse(lic.features || '{}')).join(', ') || '-' : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor[lic.status] || ''}`}>
                      {statusMap[lic.status] || lic.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditLicense(lic)}
                        disabled={lic.status === 'revoked'}
                        className="text-blue-600 text-xs hover:underline disabled:opacity-50"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleRevoke(lic.id)}
                        disabled={lic.status === 'revoked'}
                        className="text-red-600 text-xs hover:underline disabled:opacity-50"
                      >
                        撤销
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">第 {page} / {totalPages || 1} 页</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50"
          >
            上一页
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>

      {showCreateModal && <CreateLicenseModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreate} />}
      {showBatchModal && <BatchLicenseModal onClose={() => setShowBatchModal(false)} onSubmit={handleBatchCreate} />}
      {editLicense && (
        <EditLicenseModal
          license={editLicense}
          onClose={() => setEditLicense(null)}
          onSubmit={handleEditSave}
        />
      )}
    </div>
  );
}

function CreateLicenseModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [agentId, setAgentId] = useState('');
  const [domain, setDomain] = useState('');
  const [durationDays, setDurationDays] = useState(365);
  const [maxUsers, setMaxUsers] = useState(10);
  const [features, setFeatures] = useState<string[]>([]);

  const availableFeatures = [
    { key: 'basic', label: '基础功能' },
    { key: 'report', label: '报告生成' },
    { key: 'api', label: 'API 访问' },
    { key: 'custom_domain', label: '自定义域名' },
  ];

  const handleSubmit = () => {
    if (!agentId) { alert('请填写代理商ID'); return; }
    onSubmit({ agentId, domain, durationDays, maxUsers, features });
  };

  return (
    <Modal title="生成授权码" onClose={onClose} onSubmit={handleSubmit}>
      <FormField label="代理商ID" required>
        <input type="text" value={agentId} onChange={e => setAgentId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="请输入代理商ID" />
      </FormField>
      <FormField label="域名">
        <input type="text" value={domain} onChange={e => setDomain(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="可选，如 agent.example.com" />
      </FormField>
      <FormField label="有效期（天）">
        <input type="number" value={durationDays} onChange={e => setDurationDays(parseInt(e.target.value) || 365)} className="w-full px-3 py-2 border rounded-lg text-sm" min={1} />
      </FormField>
      <FormField label="最大用户数">
        <input type="number" value={maxUsers} onChange={e => setMaxUsers(parseInt(e.target.value) || 10)} className="w-full px-3 py-2 border rounded-lg text-sm" min={1} />
      </FormField>
      <FormField label="功能权限">
        <div className="flex flex-wrap gap-4">
          {availableFeatures.map(f => (
            <label key={f.key} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={features.includes(f.key)}
                onChange={e => setFeatures(e.target.checked ? [...features, f.key] : features.filter(x => x !== f.key))}
              />
              {f.label}
            </label>
          ))}
        </div>
      </FormField>
    </Modal>
  );
}

function BatchLicenseModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [count, setCount] = useState(10);
  const [agentId, setAgentId] = useState('');
  const [domain, setDomain] = useState('');
  const [durationDays, setDurationDays] = useState(365);
  const [maxUsers, setMaxUsers] = useState(10);
  const [features, setFeatures] = useState<string[]>([]);

  const availableFeatures = [
    { key: 'basic', label: '基础功能' },
    { key: 'report', label: '报告生成' },
    { key: 'api', label: 'API 访问' },
    { key: 'custom_domain', label: '自定义域名' },
  ];

  const handleSubmit = () => {
    if (!agentId) { alert('请填写代理商ID'); return; }
    if (count < 1) { alert('数量必须大于0'); return; }
    onSubmit({ count, agentId, domain, durationDays, maxUsers, features });
  };

  return (
    <Modal title="批量生成授权码" onClose={onClose} onSubmit={handleSubmit}>
      <FormField label="生成数量" required>
        <input type="number" value={count} onChange={e => setCount(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border rounded-lg text-sm" min={1} max={100} />
        <p className="text-xs text-gray-500 mt-1">每次最多生成 100 个</p>
      </FormField>
      <FormField label="代理商ID" required>
        <input type="text" value={agentId} onChange={e => setAgentId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="请输入代理商ID" />
      </FormField>
      <FormField label="域名">
        <input type="text" value={domain} onChange={e => setDomain(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="可选" />
      </FormField>
      <FormField label="有效期（天）">
        <input type="number" value={durationDays} onChange={e => setDurationDays(parseInt(e.target.value) || 365)} className="w-full px-3 py-2 border rounded-lg text-sm" min={1} />
      </FormField>
      <FormField label="最大用户数">
        <input type="number" value={maxUsers} onChange={e => setMaxUsers(parseInt(e.target.value) || 10)} className="w-full px-3 py-2 border rounded-lg text-sm" min={1} />
      </FormField>
      <FormField label="功能权限">
        <div className="flex flex-wrap gap-4">
          {availableFeatures.map(f => (
            <label key={f.key} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={features.includes(f.key)}
                onChange={e => setFeatures(e.target.checked ? [...features, f.key] : features.filter(x => x !== f.key))}
              />
              {f.label}
            </label>
          ))}
        </div>
      </FormField>
    </Modal>
  );
}

function EditLicenseModal({ license, onClose, onSubmit }: { license: AgentLicense; onClose: () => void; onSubmit: (data: any) => void }) {
  const [expiryDate, setExpiryDate] = useState(license.expiryAt ? new Date(license.expiryAt).toISOString().split('T')[0] : '');
  const [maxUsers, setMaxUsers] = useState(license.maxUsers);

  const handleSubmit = () => {
    onSubmit({
      id: license.id,
      expiryAt: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      maxUsers: maxUsers !== license.maxUsers ? maxUsers : undefined,
    });
  };

  return (
    <Modal title="编辑授权码" onClose={onClose} onSubmit={handleSubmit}>
      <FormField label="授权码">
        <div className="px-3 py-2 bg-gray-50 border rounded-lg text-sm font-mono break-all leading-relaxed">{formatLicenseKey(license.licenseKey)}</div>
      </FormField>
      <FormField label="代理商">
        <div className="px-3 py-2 bg-gray-50 border rounded-lg text-sm">{license.agentName || license.agentId}</div>
      </FormField>
      <FormField label="有效期至">
        <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
      </FormField>
      <FormField label="最大用户数">
        <input type="number" value={maxUsers} onChange={e => setMaxUsers(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border rounded-lg text-sm" min={1} />
      </FormField>
    </Modal>
  );
}

function Modal({ title, onClose, onSubmit, children }: { title: string; onClose: () => void; onSubmit: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="px-6 py-4 space-y-4">{children}</div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">取消</button>
          <button onClick={onSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">确定</button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}