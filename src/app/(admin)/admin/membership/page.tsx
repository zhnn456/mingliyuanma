'use client';

import { useState, useEffect } from 'react';

const LEVEL_LABELS: Record<string, string> = {
  monthly: '月卡',
  yearly: '年卡',
  lifetime: '终身',
};

export default function AdminMembershipPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [userStats, setUserStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    level: 'monthly',
    price: 0,
    duration: 30,
    description: '',
    features: '',
    sortOrder: 0,
    isActive: true,
  });
  const [qrForm, setQrForm] = useState({
    url: '',
    title: '扫码联系客服',
    subtitle: '微信/支付宝咨询 · 人工协助开通',
  });
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSaved, setQrSaved] = useState(false);
  const pageSize = 20;

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      const res = await fetch(`/api/admin/membership?${params}`);
      if (res.ok) {
        const d = await res.json();
        setPlans(d.plans || []);
        setTotal(d.total || 0);
        setUserStats(d.userStats || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, [page]);

  const fetchQrConfig = async () => {
    try {
      const res = await fetch('/api/config/membership-qr');
      if (res.ok) {
        const d = await res.json();
        setQrForm({
          url: d.url || '',
          title: d.title || '扫码联系客服',
          subtitle: d.subtitle || '微信/支付宝咨询 · 人工协助开通',
        });
      }
    } catch {}
  };

  useEffect(() => { fetchQrConfig(); }, []);

  const resetForm = () => {
    setForm({
      name: '',
      level: 'monthly',
      price: 0,
      duration: 30,
      description: '',
      features: '',
      sortOrder: 0,
      isActive: true,
    });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (plan: any) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      level: plan.level,
      price: plan.price,
      duration: plan.duration ?? 30,
      description: plan.description ?? '',
      features: plan.features ?? '',
      sortOrder: plan.sortOrder ?? 0,
      isActive: !!plan.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.level) {
      alert('请填写套餐名称和等级');
      return;
    }
    try {
      const payload = {
        name: form.name,
        level: form.level,
        price: parseFloat(String(form.price)) || 0,
        duration: form.level === 'lifetime' ? null : (parseInt(String(form.duration)) || 0),
        description: form.description,
        features: form.features,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      const body = editingId ? { ...payload, id: editingId } : payload;
      const res = await fetch('/api/admin/membership', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchPlans();
      } else {
        const d = await res.json();
        alert(d.error || '操作失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/membership', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      fetchPlans();
    } catch {}
  };

  const deletePlan = async (id: string) => {
    if (!confirm('确定删除此套餐？（软删除，仅禁用）')) return;
    try {
      await fetch('/api/admin/membership', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchPlans();
    } catch {}
  };

  const adjustSort = async (id: string, currentSort: number, delta: number) => {
    const newSort = currentSort + delta;
    try {
      await fetch('/api/admin/membership', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, sortOrder: newSort }),
      });
      fetchPlans();
    } catch {}
  };

  const totalUsers = userStats.reduce((sum, s: any) => sum + (s.count || 0), 0);

  const saveQrConfig = async () => {
    setQrLoading(true);
    setQrSaved(false);
    try {
      const entries = [
        { key: 'membership_qr_url', value: qrForm.url, category: 'payment', description: '会员页二维码图片URL' },
        { key: 'membership_qr_title', value: qrForm.title, category: 'payment', description: '会员页二维码标题' },
        { key: 'membership_qr_subtitle', value: qrForm.subtitle, category: 'payment', description: '会员页二维码副标题' },
      ];
      for (const item of entries) {
        const res = await fetch('/api/admin/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error(item.key + ' 保存失败');
      }
      setQrSaved(true);
      setTimeout(() => setQrSaved(false), 2000);
    } catch {
      alert('二维码配置保存失败，请重试');
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">会员等级</h2>
          <p className="text-sm text-gray-500">共 {total} 个套餐 · {totalUsers} 名会员用户</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm"
        >
          + 创建套餐
        </button>
      </div>

      {userStats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {userStats.map((s: any) => (
            <div key={s.memberLevel} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="text-xs text-gray-500">{LEVEL_LABELS[s.memberLevel] || s.memberLevel}</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{s.count}</div>
              <div className="text-xs text-gray-400">用户数量</div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-gray-900 mb-4">
              {editingId ? '编辑套餐' : '创建套餐'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">套餐名称</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如：月卡会员"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">等级（唯一标识）</label>
                <input
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  placeholder="如：monthly / yearly / lifetime"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">价格（元）</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              {form.level !== 'lifetime' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">时长（天）</label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                    placeholder="如：30"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="套餐描述信息"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">功能列表（JSON 字符串）</label>
                <textarea
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder='如：["无限次占卜","优先客服"]'
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">排序（数字越小越靠前）</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">启用此套餐</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg text-sm"
                >
                  {editingId ? '保存' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">名称</th>
              <th className="px-4 py-3 text-gray-500 font-medium">等级</th>
              <th className="px-4 py-3 text-gray-500 font-medium">价格</th>
              <th className="px-4 py-3 text-gray-500 font-medium">时长</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">排序</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 text-xs rounded bg-mingli-100 text-mingli-700">
                    {LEVEL_LABELS[p.level] || p.level}
                  </span>
                </td>
                <td className="px-4 py-3">¥{(p.price || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {p.level === 'lifetime' || p.duration === null ? '永久' : `${p.duration} 天`}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {p.isActive ? '已启用' : '已禁用'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adjustSort(p.id, p.sortOrder || 0, -1)}
                      className="w-6 h-6 text-xs border rounded hover:bg-gray-100"
                    >
                      ↑
                    </button>
                    <span className="text-gray-600 text-xs min-w-[20px] text-center">{p.sortOrder ?? 0}</span>
                    <button
                      onClick={() => adjustSort(p.id, p.sortOrder || 0, 1)}
                      className="w-6 h-6 text-xs border rounded hover:bg-gray-100"
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-xs text-mingli-500 hover:text-mingli-700"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => toggleActive(p.id, p.isActive)}
                    className="text-xs text-orange-600 hover:text-orange-800"
                  >
                    {p.isActive ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => deletePlan(p.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {plans.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  暂无会员套餐数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50"
          >
            上一页
          </button>
          <button
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>

      {/* 会员页二维码配置 */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">会员页二维码</h3>
        <p className="text-xs text-gray-500 mb-4">配置后将显示在会员中心「支付方式说明」右侧。将二维码图片上传至服务器/图床后，把图片地址填入下方。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">二维码图片 URL</label>
            <input
              value={qrForm.url}
              onChange={(e) => setQrForm({ ...qrForm, url: e.target.value })}
              placeholder="如：https://ming8.online/images/membership-qr.png"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">标题</label>
            <input
              value={qrForm.title}
              onChange={(e) => setQrForm({ ...qrForm, title: e.target.value })}
              placeholder="如：扫码联系客服"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">副标题</label>
            <input
              value={qrForm.subtitle}
              onChange={(e) => setQrForm({ ...qrForm, subtitle: e.target.value })}
              placeholder="如：微信/支付宝咨询 · 人工协助开通"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        {qrForm.url && (
          <div className="mb-4 inline-flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-white relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrForm.url} alt="预览" className="absolute inset-0 w-full h-full object-contain" />
            </div>
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-800">{qrForm.title}</div>
              <div className="text-xs mt-0.5">{qrForm.subtitle}</div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={saveQrConfig}
            disabled={qrLoading}
            className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {qrLoading ? '保存中...' : '保存配置'}
          </button>
          {qrSaved && <span className="text-sm text-green-600">已保存</span>}
        </div>
      </div>
    </div>
  );
}