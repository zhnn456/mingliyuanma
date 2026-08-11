'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RenewInfo {
  agent: {
    id: string;
    brandName: string;
    level: string;
    planType: string;
    licenseExpiry: string | null;
    updateServiceExpiry: string | null;
  };
  options: {
    annualRenew: { price: number; name: string; desc: string };
    updateServiceRenew: { price: number; name: string; desc: string };
    upgradeToLifetime: { price: number; name: string; desc: string };
  };
  records: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: string;
    remark: string | null;
  }>;
}

const TYPE_LABELS: Record<string, string> = {
  annual_renew: '年度授权续费',
  update_service: '更新服务续费',
  upgrade_lifetime: '升级永久授权',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  paid: { label: '已支付', color: 'bg-blue-100 text-blue-700' },
};

export default function AgentRenewPage() {
  const [data, setData] = useState<RenewInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    loadRenewInfo();
  }, []);

  const loadRenewInfo = async () => {
    try {
      const res = await fetch('/api/agent/renew');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        const e = await res.json();
        setError(e.error || '加载失败');
      }
    } catch {
      setError('网络错误');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      alert('请选择续费类型');
      return;
    }
    if (!confirm('确定要提交续费申请吗？平台客服会与您联系确认支付方式。')) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/agent/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType }),
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message || '续费申请已提交，客服会尽快与您联系');
        setSelectedType('');
        loadRenewInfo();
      } else {
        alert(d.error || '提交失败');
      }
    } catch {
      alert('网络错误');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!data) return <div className="text-center py-20 text-gray-400">暂无数据</div>;

  const { agent, options, records } = data;

  const renewOptions = [
    { key: 'annual_renew', ...options.annualRenew },
    { key: 'update_service', ...options.updateServiceRenew },
    { key: 'upgrade_lifetime', ...options.upgradeToLifetime },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">续费管理</h1>
        <p className="text-sm text-gray-500 mt-1">续费授权、续费更新服务或升级永久授权</p>
      </div>

      {/* 当前授权状态 */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-bold text-gray-800 mb-3">当前授权状态</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-1">授权类型</div>
            <div className="font-medium">
              {agent.planType === 'lifetime' ? '永久买断' :
               agent.planType === 'annual' ? '年度授权' : agent.planType}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-1">授权到期</div>
            <div className="font-medium">
              {agent.licenseExpiry ? new Date(agent.licenseExpiry).toLocaleDateString('zh-CN') : '永久'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-1">更新服务到期</div>
            <div className="font-medium">
              {agent.updateServiceExpiry ? new Date(agent.updateServiceExpiry).toLocaleDateString('zh-CN') : '永久'}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-1">品牌名称</div>
            <div className="font-medium">{agent.brandName}</div>
          </div>
        </div>
      </div>

      {/* 续费选项 */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-bold text-gray-800 mb-3">续费选项</h3>
        <div className="space-y-3">
          {renewOptions.map((opt) => (
            <label
              key={opt.key}
              className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedType === opt.key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="renewType"
                    value={opt.key}
                    checked={selectedType === opt.key}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{opt.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{opt.desc}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">¥{opt.price}</div>
                  <div className="text-xs text-gray-400">/年</div>
                </div>
              </div>
            </label>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedType}
          className="mt-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300"
        >
          {submitting ? '提交中...' : '提交续费申请'}
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          提交申请后，平台客服会通过电话或微信与您联系确认支付方式
        </p>
      </div>

      {/* 续费记录 */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-bold text-gray-800 mb-3">续费记录</h3>
        {records.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">暂无续费记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 px-3 font-medium">类型</th>
                  <th className="py-2 px-3 font-medium">金额</th>
                  <th className="py-2 px-3 font-medium">状态</th>
                  <th className="py-2 px-3 font-medium">申请时间</th>
                  <th className="py-2 px-3 font-medium">备注</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const status = STATUS_LABELS[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-700' };
                  return (
                    <tr key={r.id} className="border-b">
                      <td className="py-2 px-3 text-gray-700">{TYPE_LABELS[r.type] || r.type}</td>
                      <td className="py-2 px-3 text-gray-700">¥{r.amount}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-2 py-1 rounded ${status.color}`}>{status.label}</span>
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-xs">
                        {new Date(r.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-2 px-3 text-gray-500 text-xs">{r.remark || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 联系客服 */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 text-center">
        <p className="text-sm text-gray-600 mb-2">如有续费问题，请联系平台客服</p>
        <Link href="/agent/tickets" className="text-blue-600 hover:underline text-sm">
          提交技术工单 →
        </Link>
      </div>
    </div>
  );
}
