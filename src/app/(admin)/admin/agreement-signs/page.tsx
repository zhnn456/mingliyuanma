'use client';

import { useState, useEffect } from 'react';

type SignRecord = {
  no: string;
  name: string;
  domain: string;
  contact: string;
  email: string;
  signerName: string;
  signerIdCard: string;
  signerPhone: string;
  signature: string;
  signTime: string;
  ip: string;
  updatedAt: string | null;
};

/** 身份证脱敏：前 4 + **** + 后 4 */
function maskIdCard(v: string): string {
  if (!v) return '-';
  return v.length >= 8 ? v.slice(0, 4) + '**********' + v.slice(-4) : '****';
}

/** 手机号脱敏：138****0000 */
function maskPhone(v: string): string {
  if (!v) return '-';
  return v.length >= 7 ? v.slice(0, 3) + '****' + v.slice(-4) : '****';
}

export default function AgreementSignsPage() {
  const [signs, setSigns] = useState<SignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewSig, setViewSig] = useState<{ name: string; sig: string } | null>(null);

  const fetchSigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agreement/signs');
      if (res.ok) {
        const d = await res.json();
        setSigns(d.signs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (s: SignRecord) => {
    if (!confirm(`确定要撤销协议「${s.no}」吗？\n\n撤销后该协议签署记录将删除，协议失效。可在代理商列表重新生成新协议。`)) return;
    try {
      const res = await fetch(`/api/agreement/sign?no=${encodeURIComponent(s.no)}`, { method: 'DELETE' });
      if (res.ok) {
        alert('协议已撤销');
        fetchSigns();
      } else {
        const d = await res.json().catch(() => null);
        alert(d?.error || '撤销失败');
      }
    } catch {
      alert('撤销失败');
    }
  };

  useEffect(() => { fetchSigns(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">授权协议签署记录</h2>
          <p className="text-sm text-gray-500">共 {signs.length} 份协议已签署（含签署人实名信息与手写签名）</p>
        </div>
        <button
          onClick={fetchSigns}
          className="px-4 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50"
        >
          刷新
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-gray-500 font-medium">协议编号</th>
              <th className="px-4 py-3 text-gray-500 font-medium">乙方名称</th>
              <th className="px-4 py-3 text-gray-500 font-medium">域名</th>
              <th className="px-4 py-3 text-gray-500 font-medium">签署人</th>
              <th className="px-4 py-3 text-gray-500 font-medium">身份证</th>
              <th className="px-4 py-3 text-gray-500 font-medium">手机号</th>
              <th className="px-4 py-3 text-gray-500 font-medium">签名</th>
              <th className="px-4 py-3 text-gray-500 font-medium">签署时间</th>
              <th className="px-4 py-3 text-gray-500 font-medium">IP</th>
              <th className="px-4 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">加载中...</td>
              </tr>
            ) : signs.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">暂无签署记录</td>
              </tr>
            ) : (
              signs.map((s, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.no || '-'}</td>
                  <td className="px-4 py-3 text-gray-900">{s.name || '-'}</td>
                  <td className="px-4 py-3 text-blue-600 font-mono text-xs">{s.domain || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{s.signerName || s.contact || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{maskIdCard(s.signerIdCard)}</td>
                  <td className="px-4 py-3 text-gray-500">{maskPhone(s.signerPhone)}</td>
                  <td className="px-4 py-3">
                    {s.signature ? (
                      <button
                        onClick={() => setViewSig({ name: s.signerName || s.name, sig: s.signature })}
                        className="text-purple-600 hover:text-purple-800 underline"
                      >
                        查看签名
                      </button>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.signTime || (s.updatedAt ? new Date(s.updatedAt).toLocaleString('zh-CN') : '-')}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{s.ip || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRevoke(s)}
                      className="text-red-600 hover:text-red-800 text-xs underline"
                    >
                      撤销
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 签名查看弹窗 */}
      {viewSig && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setViewSig(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">{viewSig.name} 的手写签名</h3>
              <button onClick={() => setViewSig(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewSig.sig} alt="手写签名" className="w-full border border-gray-200 rounded-lg bg-gray-50" />
            <p className="text-xs text-gray-400 mt-3">该签名图片随签署记录一并保存，作为电子签字凭证</p>
          </div>
        </div>
      )}
    </div>
  );
}
