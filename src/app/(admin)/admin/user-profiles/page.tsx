'use client';

import { useState, useEffect } from 'react';

const statusMap: Record<string, string> = { pending: '待支付', paid: '已支付', failed: '失败', refunded: '已退款' };
const statusColor: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-gray-100 text-gray-600' };
const typeMap: Record<string, string> = { membership: '会员', offering: '供奉', pdf_report: 'PDF' };

export default function AdminUserProfilesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [profileDetail, setProfileDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const pageSize = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/admin/user-profiles?${params}`);
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users || []);
        setTotal(d.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchProfileDetail = async (userId: string) => {
    setDetailLoading(true);
    setProfileDetail(null);
    try {
      const res = await fetch(`/api/admin/user-profiles?id=${userId}`);
      if (res.ok) {
        const d = await res.json();
        setProfileDetail(d.profile);
      }
    } catch {} finally { setDetailLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleExpand = (userId: string) => {
    if (expandedId === userId) {
      setExpandedId(null);
      setProfileDetail(null);
    } else {
      setExpandedId(userId);
      fetchProfileDetail(userId);
    }
  };

  const updateUser = async (userId: string, payload: any) => {
    try {
      const res = await fetch('/api/admin/user-profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...payload }),
      });
      if (res.ok) {
        if (expandedId === userId) fetchProfileDetail(userId);
        fetchUsers();
      }
    } catch {}
  };

  const memberLevelMap: Record<string, string> = { free: '普通', monthly: '月卡', yearly: '年卡', lifetime: '终身', vip: 'VIP' };
  const memberLevelColor: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    monthly: 'bg-blue-100 text-blue-700',
    yearly: 'bg-purple-100 text-purple-700',
    lifetime: 'bg-yellow-100 text-yellow-700',
    vip: 'bg-gradient-to-r from-yellow-200 to-orange-200 text-orange-800',
  };

  const defaultAvatar = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">用户画像</h2>
          <p className="text-sm text-gray-500">共 {total} 个用户</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="搜索邮箱、名称或手机号"
          className="flex-1 px-4 py-2 border rounded-lg text-sm"
        />
        <button type="submit" className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800">搜索</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium w-10"></th>
              <th className="px-4 py-3 text-gray-500 font-medium">用户</th>
              <th className="px-4 py-3 text-gray-500 font-medium">会员等级</th>
              <th className="px-4 py-3 text-gray-500 font-medium">消费金额</th>
              <th className="px-4 py-3 text-gray-500 font-medium">排盘次数</th>
              <th className="px-4 py-3 text-gray-500 font-medium">注册时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleExpand(u.id)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-500"
                  >
                    {expandedId === u.id ? '−' : '+'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center text-sm font-semibold">
                      {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : defaultAvatar(u.name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{u.name || '-'}</div>
                      <div className="text-xs text-gray-500">{u.email || '-'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${memberLevelColor[u.memberLevel] || ''}`}>
                    {memberLevelMap[u.memberLevel] || u.memberLevel || 'free'}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold">¥{Number(u.totalAmount || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600">
                  订单 {(u.orderCount || 0)} · 排盘 {(u.divinationCount || 0)}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('zh-CN') : '-'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleExpand(u.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    {expandedId === u.id ? '收起' : '详情'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {expandedId && (
          <div className="border-t bg-gray-50 p-4">
            {detailLoading ? (
              <div className="text-center text-sm text-gray-500 py-8">加载中...</div>
            ) : profileDetail ? (
              <ProfileDetailPanel
                profile={profileDetail}
                onUpdate={(payload) => updateUser(expandedId!, payload)}
              />
            ) : (
              <div className="text-center text-sm text-gray-500 py-8">暂无数据</div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">第 {page} / {Math.max(1, Math.ceil(total / pageSize))} 页</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">上一页</button>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">下一页</button>
        </div>
      </div>
    </div>
  );
}

function ProfileDetailPanel({ profile, onUpdate }: { profile: any; onUpdate: (p: any) => void }) {
  const [memberLevel, setMemberLevel] = useState(profile.memberLevel || 'free');
  const [remark, setRemark] = useState(profile.remark || '');
  const [tagInput, setTagInput] = useState(profile.tags || '');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustRemark, setAdjustRemark] = useState('');

  const stats = profile.stats || {};

  const statCards = [
    { label: '订单数', value: stats.orderCount || 0, color: 'bg-blue-50 text-blue-700' },
    { label: '消费总额', value: `¥${Number(stats.totalAmount || 0).toFixed(2)}`, color: 'bg-green-50 text-green-700' },
    { label: '排盘总数', value: stats.divinationCount || 0, color: 'bg-purple-50 text-purple-700' },
    { label: '八字', value: stats.baziCount || 0, color: 'bg-indigo-50 text-indigo-700' },
    { label: '紫微', value: stats.ziweiCount || 0, color: 'bg-pink-50 text-pink-700' },
    { label: '奇门', value: stats.qimenCount || 0, color: 'bg-orange-50 text-orange-700' },
    { label: '梅花', value: stats.meihuaCount || 0, color: 'bg-teal-50 text-teal-700' },
    { label: '积分余额', value: stats.balance || 0, color: 'bg-yellow-50 text-yellow-700' },
    { label: '工单数', value: stats.ticketCount || 0, color: 'bg-red-50 text-red-700' },
  ];

  const handleSaveMember = () => {
    onUpdate({ memberLevel });
  };

  const handleSaveRemark = () => {
    onUpdate({ remark });
  };

  const handleSaveTags = () => {
    onUpdate({ tags: tagInput });
  };

  const handleAdjustBalance = () => {
    const amount = Number(adjustAmount);
    if (!amount) return;
    onUpdate({
      balanceAction: {
        amount,
        type: 'admin_adjust',
        remark: adjustRemark || '管理员调整',
      },
    });
    setAdjustAmount('');
    setAdjustRemark('');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {statCards.map((s: any) => (
          <div key={s.label} className={`rounded-lg p-3 ${s.color}`}>
            <div className="text-xs opacity-70">{s.label}</div>
            <div className="text-lg font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500">
        最近活动时间：{stats.lastActivityTime ? new Date(stats.lastActivityTime).toLocaleString('zh-CN') : '暂无'}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-semibold text-sm mb-3 text-gray-800">快速操作</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-20">会员等级</label>
              <select
                value={memberLevel}
                onChange={e => setMemberLevel(e.target.value)}
                className="flex-1 text-xs border rounded px-2 py-1"
              >
                <option value="free">普通</option>
                <option value="monthly">月卡</option>
                <option value="yearly">年卡</option>
                <option value="lifetime">终身</option>
                <option value="vip">VIP</option>
              </select>
              <button onClick={handleSaveMember} className="text-xs px-3 py-1 bg-gray-900 text-white rounded hover:bg-gray-800">保存</button>
            </div>

            <div className="flex items-start gap-2">
              <label className="text-xs text-gray-600 w-20 pt-1">标签</label>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="多个标签用逗号分隔"
                className="flex-1 text-xs border rounded px-2 py-1"
              />
              <button onClick={handleSaveTags} className="text-xs px-3 py-1 bg-gray-900 text-white rounded hover:bg-gray-800">保存</button>
            </div>

            <div className="flex items-start gap-2">
              <label className="text-xs text-gray-600 w-20 pt-1">备注</label>
              <textarea
                value={remark}
                onChange={e => setRemark(e.target.value)}
                rows={2}
                className="flex-1 text-xs border rounded px-2 py-1"
              />
              <button onClick={handleSaveRemark} className="text-xs px-3 py-1 bg-gray-900 text-white rounded hover:bg-gray-800">保存</button>
            </div>

            <div className="border-t pt-3">
              <div className="text-xs text-gray-600 mb-2">积分调整（正数增加，负数扣减）</div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="如 100 或 -50"
                  className="w-28 text-xs border rounded px-2 py-1"
                />
                <input
                  value={adjustRemark}
                  onChange={e => setAdjustRemark(e.target.value)}
                  placeholder="调整原因"
                  className="flex-1 text-xs border rounded px-2 py-1"
                />
                <button onClick={handleAdjustBalance} className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">确认</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-semibold text-sm mb-3 text-gray-800">最近订单</h4>
          {profile.orderHistory && profile.orderHistory.length > 0 ? (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {profile.orderHistory.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between text-xs py-1 border-b last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-500">{o.orderNo}</span>
                    <span>{typeMap[o.type] || o.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>¥{Number(o.amount || 0).toFixed(2)}</span>
                    <span className={`px-1.5 py-0.5 rounded ${statusColor[o.status] || ''}`}>
                      {statusMap[o.status] || o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 py-4 text-center">暂无订单</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-semibold text-sm mb-3 text-gray-800">积分流水</h4>
        {profile.pointsLedger && profile.pointsLedger.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="text-left py-2">时间</th>
                  <th className="text-left py-2">类型</th>
                  <th className="text-right py-2">变动</th>
                  <th className="text-right py-2">余额</th>
                  <th className="text-left py-2">备注</th>
                </tr>
              </thead>
              <tbody>
                {profile.pointsLedger.map((l: any) => (
                  <tr key={l.id} className="border-b last:border-b-0">
                    <td className="py-2 text-gray-500">{l.createdAt ? new Date(l.createdAt).toLocaleString('zh-CN') : '-'}</td>
                    <td className="py-2">{l.type}</td>
                    <td className={`py-2 text-right font-medium ${Number(l.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Number(l.amount) >= 0 ? '+' : ''}{l.amount}
                    </td>
                    <td className="py-2 text-right">{l.balance}</td>
                    <td className="py-2 text-gray-500">{l.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-gray-400 py-4 text-center">暂无积分记录</div>
        )}
      </div>
    </div>
  );
}
