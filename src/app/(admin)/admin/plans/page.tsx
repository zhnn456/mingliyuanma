'use client';

import { useState, useEffect } from 'react';

const LEVEL_LABELS: Record<string, string> = {
  monthly: '月卡',
  yearly: '年卡',
  lifetime: '终身',
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
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

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) {
        const d = await res.json();
        setPlans(d.rows || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

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
    const payload = {
      ...form,
      id: editingId || undefined,
      price: parseFloat(String(form.price)) || 0,
      duration: form.level === 'lifetime' ? null : (parseInt(String(form.duration)) || 0),
    };
    const res = await fetch('/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowModal(false);
      resetForm();
      fetchPlans();
    } else {
      const d = await res.json();
      alert(d.error || '操作失败');
    }
  };

  const togglePlan = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchPlans();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">会员套餐管理</h2>
          <p className="text-sm text-gray-500">共 {plans.length} 个套餐</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-red-700 text-white rounded-lg text-sm"
        >
          + 创建套餐
        </button>
      </div>

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
                <label className="block text-xs text-gray-500 mb-1">等级</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  disabled={!!editingId}
                >
                  <option value="monthly">月卡 (monthly)</option>
                  <option value="yearly">年卡 (yearly)</option>
                  <option value="lifetime">终身 (lifetime)</option>
                </select>
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
                <label className="block text-xs text-gray-500 mb-1">功能列表（JSON）</label>
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
              <th className="px-4 py-3 text-gray-500 font-medium">排序</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
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
                <td className="px-4 py-3">¥{p.price}</td>
                <td className="px-4 py-3 text-gray-600">
                  {p.level === 'lifetime' ? '永久' : `${p.duration} 天`}
                </td>
                <td className="px-4 py-3 text-gray-600">{p.sortOrder}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {p.isActive ? '已启用' : '已禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="text-xs text-mingli-500 hover:text-mingli-700"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => togglePlan(p.id, p.isActive)}
                    className="text-xs text-orange-600 hover:text-orange-800"
                  >
                    {p.isActive ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
            {plans.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  暂无套餐数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}