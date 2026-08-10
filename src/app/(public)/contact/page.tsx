'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // 模拟提交（后续接入邮件/后台通知）
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setSuccess(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-12">
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">联系我们</h1>
          <p className="text-gray-600">有任何问题、建议或合作意向，欢迎与我们取得联系</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 联系信息 */}
          <div className="space-y-6">
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
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">💬</div>
                  <div>
                    <div className="font-medium text-gray-900">微信公众号</div>
                    <div className="text-gray-500">先知命理网</div>
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

          {/* 联系表单 */}
          <div className="card">
            <h2 className="card-title">发送消息</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  消息已发送成功！我们会尽快回复您。
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="请输入您的姓名"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="请输入您的邮箱"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">主题</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">请选择主题</option>
                  <option value="suggestion">功能建议</option>
                  <option value="bug">问题反馈</option>
                  <option value="cooperation">合作咨询</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">消息内容</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="请详细描述您的问题或建议..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {loading ? '发送中...' : '发送消息'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
