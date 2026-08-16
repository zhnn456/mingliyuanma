'use client';

import { useState } from 'react';

const SUBJECT_OPTIONS = [
  { value: 'suggestion', label: '功能建议' },
  { value: 'bug', label: '问题反馈' },
  { value: 'cooperation', label: '合作咨询' },
  { value: 'source', label: '源码部署咨询' },
  { value: 'other', label: '其他' },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, content }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || '提交失败，请稍后重试');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setContent('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setErrorMsg('网络错误，请检查网络后重试');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-12">
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">联系我们</h1>
          <p className="text-gray-600">有任何问题、建议或合作意向，欢迎与我们取得联系</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左侧：联系信息 + 客服二维码 */}
          <div className="space-y-6">
            {/* 客服二维码卡片 */}
            <div className="card">
              <h2 className="card-title text-center">扫码添加客服</h2>
              <div className="flex flex-col items-center">
                {/* 二维码 - 原始尺寸 888×1131，按比例完整展示 */}
                <div
                  className="w-full max-w-[300px] mx-auto rounded-xl overflow-hidden border-2 border-stone-100 bg-white shadow-sm"
                  style={{ aspectRatio: '888 / 1131' }}
                >
                  <img
                    src="/images/qr-customer-service.jpg"
                    alt="客服二维码"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-sm text-gray-600 font-medium mt-4">微信 / 支付宝均可扫码</p>
                <p className="text-xs text-gray-400 mt-1">充值 · 购买卡密 · 业务咨询 · 源码部署</p>
              </div>
            </div>

            {/* 联系方式 */}
            <div className="card">
              <h2 className="card-title">联系方式</h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">📧</div>
                  <div>
                    <div className="font-medium text-gray-900">电子邮箱</div>
                    <div className="text-gray-500">support@ming8.online</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">🕐</div>
                  <div>
                    <div className="font-medium text-gray-900">在线时间</div>
                    <div className="text-gray-500">工作日 9:00 - 18:00</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 常见问题 */}
            <div className="card">
              <h2 className="card-title">常见问题</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium text-gray-900 mb-1">排盘结果不准确？</div>
                  <p className="text-gray-500">请检查输入的出生信息是否正确，注意公历/农历和出生时辰的选择。</p>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">如何升级会员？</div>
                  <p className="text-gray-500">前往会员中心选择适合的套餐，完成支付后即可享受会员权益。</p>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">数据安全有保障吗？</div>
                  <p className="text-gray-500">您的个人信息采用加密存储，我们严格保护用户隐私，请放心使用。</p>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：联系表单 */}
          <div className="card">
            <h2 className="card-title">发送消息</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <div className="font-medium">消息已提交成功！</div>
                    <div className="text-xs mt-0.5">我们已收到您的消息，会尽快通过邮箱或客服与您联系。</div>
                  </div>
                </div>
              )}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="请输入您的姓名"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="请输入您的邮箱（用于回复）"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">主题 <span className="text-red-500">*</span></label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">请选择主题</option>
                  {SUBJECT_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">消息内容 <span className="text-red-500">*</span></label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  placeholder="请详细描述您的问题或建议..."
                  required
                  maxLength={5000}
                />
                <div className="text-right text-xs text-gray-400 mt-1">{content.length}/5000</div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    发送中...
                  </>
                ) : '发送消息'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                提交后消息将直达管理后台，客服会尽快处理
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
