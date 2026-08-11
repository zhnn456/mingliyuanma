'use client';

import { useState, useEffect } from 'react';
import { CARD_KEY_DENOMINATIONS } from '@/lib/pricing';

// 卡密类型映射
const TYPE_MAP: Record<string, string> = {
  lingzhu: '积分卡',
  agent_balance: '代理商余额卡',
};

// 卡密状态映射
const STATUS_MAP: Record<string, string> = {
  unused: '未使用',
  used: '已使用',
  expired: '已过期',
  disabled: '已禁用',
};

const STATUS_COLOR: Record<string, string> = {
  unused: 'bg-green-100 text-green-800',
  used: 'bg-gray-100 text-gray-600',
  expired: 'bg-yellow-100 text-yellow-800',
  disabled: 'bg-red-100 text-red-800',
};

// 有效期选项
const EXPIRY_OPTIONS = [
  { label: '30天', days: 30 },
  { label: '90天', days: 90 },
  { label: '365天', days: 365 },
  { label: '永久', days: 0 },
];

function fmt(d: string) {
  try { return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return d || '-'; }
}

export default function AdminCardKeysPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, unused: 0, used: 0, disabled: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // 筛选条件
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // 生成表单（显式指定 number 类型，避免 as const 字面量推断问题）
  const [form, setForm] = useState<{
    type: string;
    denomination: number;
    value: number;
    price: number;
    customValue: boolean;
    customInput: string;
    count: number;
    expiryDays: number;
  }>({
    type: 'lingzhu',
    denomination: Number(CARD_KEY_DENOMINATIONS[0].value),
    value: Number(CARD_KEY_DENOMINATIONS[0].lingzhu),
    price: Number(CARD_KEY_DENOMINATIONS[0].value),
    customValue: false,
    customInput: '',
    count: 10,
    expiryDays: 365,
  });

  // 生成结果（用于展示和导出）
  const [generated, setGenerated] = useState<any[] | null>(null);
  const [copied, setCopied] = useState(false);

  // 拉取卡密列表
  const fetchCards = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      params.set('pageSize', '100');
      const res = await fetch(`/api/admin/card-keys?${params}`);
      if (res.ok) {
        const d = await res.json();
        setCards(d.rows || []);
        setStats(d.stats || { total: 0, unused: 0, used: 0, disabled: 0, expired: 0 });
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCards(); }, [filterStatus, filterType]);

  // 选择预设面额时联动 value 和 price
  const onDenominationChange = (val: number) => {
    const denom = CARD_KEY_DENOMINATIONS.find(d => d.value === val);
    if (denom) {
      setForm({
        ...form,
        denomination: denom.value,
        value: form.type === 'lingzhu' ? denom.lingzhu : denom.value,
        price: denom.value,
        customValue: false,
      });
    }
  };

  // 切换卡密类型时重置面值
  const onTypeChange = (type: string) => {
    const denom = CARD_KEY_DENOMINATIONS[0];
    setForm({
      ...form,
      type,
      denomination: denom.value,
      value: type === 'lingzhu' ? denom.lingzhu : denom.value,
      price: denom.value,
      customValue: false,
      customInput: '',
    });
  };

  // 切换自定义面值
  const onCustomToggle = (checked: boolean) => {
    setForm({ ...form, customValue: checked });
    if (checked) {
      setForm({ ...form, customValue: true, value: 0, price: 0 });
    } else {
      const denom = CARD_KEY_DENOMINATIONS.find(d => d.value === form.denomination) || CARD_KEY_DENOMINATIONS[0];
      setForm({
        ...form,
        customValue: false,
        value: form.type === 'lingzhu' ? denom.lingzhu : denom.value,
        price: denom.value,
        customInput: '',
      });
    }
  };

  // 生成卡密
  const handleGenerate = async () => {
    let value = form.value;
    let price = form.price;

    // 自定义面值处理
    if (form.customValue && form.customInput) {
      const num = parseFloat(form.customInput);
      if (!num || num <= 0) { alert('请输入有效的自定义面值'); return; }
      if (form.type === 'lingzhu') {
        value = num;       // 积分数
        price = num / 10;  // 1元=10积分
      } else {
        value = num;  // 元数
        price = num;  // 售价=面值
      }
    }

    if (!value || value <= 0) { alert('面值必须大于 0'); return; }
    if (!form.count || form.count <= 0) { alert('数量必须大于 0'); return; }

    setGenerating(true);
    try {
      const res = await fetch('/api/admin/card-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: Number(form.count),
          type: form.type,
          value: Number(value),
          price: Number(price),
          expiryDays: Number(form.expiryDays),
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setGenerated(d.items || []);
        fetchCards();
      } else {
        alert(d.error || '生成失败');
      }
    } catch { alert('网络错误'); } finally { setGenerating(false); }
  };

  // 禁用卡密
  const handleDisable = async (id: string) => {
    if (!confirm('确定要禁用此卡密吗？')) return;
    const res = await fetch(`/api/admin/card-keys?id=${id}`, { method: 'DELETE' });
    if (res.ok) { fetchCards(); } else { const d = await res.json(); alert(d.error || '禁用失败'); }
  };

  // 导出卡密为文本（方便复制）
  const exportText = () => {
    if (!generated || generated.length === 0) return '';
    const header = `# 卡密批次 - ${new Date().toLocaleString('zh-CN')}\n# 类型: ${TYPE_MAP[form.type]} | 面值: ${form.value} | 数量: ${generated.length}\n\n`;
    const lines = generated.map(c => c.code).join('\n');
    return header + lines;
  };

  // 复制到剪贴板
  const handleCopy = async () => {
    const text = exportText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { alert('复制失败，请手动选择文本复制'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">卡密管理</h2>
          <p className="text-sm text-gray-500">生成和管理充值卡密，替代支付系统进行充值</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: '总卡密', value: stats.total, color: 'bg-blue-50 text-blue-700' },
          { label: '未使用', value: stats.unused, color: 'bg-green-50 text-green-700' },
          { label: '已使用', value: stats.used, color: 'bg-gray-50 text-gray-700' },
          { label: '已过期', value: stats.expired, color: 'bg-yellow-50 text-yellow-700' },
          { label: '已禁用', value: stats.disabled, color: 'bg-red-50 text-red-700' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-xs mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 生成卡密表单 */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">生成卡密</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 卡密类型 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">卡密类型</label>
            <select
              value={form.type}
              onChange={e => onTypeChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="lingzhu">积分卡（充值积分）</option>
              <option value="agent_balance">代理商余额卡（充值余额）</option>
            </select>
          </div>

          {/* 面值选择 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">面值</label>
            {!form.customValue ? (
              <select
                value={form.denomination}
                onChange={e => onDenominationChange(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {CARD_KEY_DENOMINATIONS.map(d => (
                  <option key={d.value} value={d.value}>
                    {form.type === 'lingzhu' ? d.label : `${d.value}元卡`}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                value={form.customInput}
                onChange={e => setForm({ ...form, customInput: e.target.value })}
                placeholder={form.type === 'lingzhu' ? '积分数（如 200）' : '元数（如 20）'}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            )}
            <label className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" checked={form.customValue} onChange={e => onCustomToggle(e.target.checked)} />
              自定义面值
            </label>
          </div>

          {/* 数量 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">数量</label>
            <input
              type="number"
              value={form.count}
              min={1}
              max={1000}
              onChange={e => setForm({ ...form, count: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* 有效期 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">有效期</label>
            <select
              value={form.expiryDays}
              onChange={e => setForm({ ...form, expiryDays: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {EXPIRY_OPTIONS.map(opt => (
                <option key={opt.days} value={opt.days}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 生成信息预览 */}
        <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          {form.customValue && form.customInput
            ? `将生成 ${form.count} 张${TYPE_MAP[form.type]}，面值 ${form.customInput}${form.type === 'lingzhu' ? '积分' : '元'}`
            : `将生成 ${form.count} 张${TYPE_MAP[form.type]}，面值 ${form.type === 'lingzhu' ? `${form.value}积分` : `${form.price}元`}`
          }
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-3 px-5 py-2 bg-red-700 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-red-800"
        >
          {generating ? '生成中...' : '生成卡密'}
        </button>
      </div>

      {/* 生成结果（导出区域） */}
      {generated && generated.length > 0 && (
        <div className="bg-white rounded-xl border p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">生成结果（{generated.length} 张）</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
              >
                {copied ? '✓ 已复制' : '复制全部'}
              </button>
              <button
                onClick={() => setGenerated(null)}
                className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={exportText()}
            className="w-full h-48 px-3 py-2 border rounded-lg text-sm font-mono bg-gray-50"
            onClick={e => (e.target as HTMLTextAreaElement).select()}
          />
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-sm"
        >
          <option value="">全部状态</option>
          <option value="unused">未使用</option>
          <option value="used">已使用</option>
          <option value="expired">已过期</option>
          <option value="disabled">已禁用</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-sm"
        >
          <option value="">全部类型</option>
          <option value="lingzhu">积分卡</option>
          <option value="agent_balance">代理商余额卡</option>
        </select>
      </div>

      {/* 卡密列表表格 */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">卡密代码</th>
              <th className="px-4 py-3 text-gray-500 font-medium">类型</th>
              <th className="px-4 py-3 text-gray-500 font-medium">面值</th>
              <th className="px-4 py-3 text-gray-500 font-medium">售价</th>
              <th className="px-4 py-3 text-gray-500 font-medium">状态</th>
              <th className="px-4 py-3 text-gray-500 font-medium">创建时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">使用时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">使用者</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">加载中...</td></tr>
            ) : cards.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">暂无卡密记录</td></tr>
            ) : cards.map((c: any) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold text-gray-900">{c.code}</td>
                <td className="px-4 py-3">{TYPE_MAP[c.type] || c.type}</td>
                <td className="px-4 py-3">{c.type === 'lingzhu' ? `${c.value}积分` : `¥${c.value}`}</td>
                <td className="px-4 py-3 text-gray-500">¥{c.price}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLOR[c.status] || ''}`}>
                    {STATUS_MAP[c.status] || c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{fmt(c.createdAt)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{fmt(c.usedAt)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">{c.usedBy || '-'}</td>
                <td className="px-4 py-3">
                  {(c.status === 'unused' || c.status === 'expired') && (
                    <button
                      onClick={() => handleDisable(c.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      禁用
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
