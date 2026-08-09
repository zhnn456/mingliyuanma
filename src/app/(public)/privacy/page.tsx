import type { Metadata } from 'next';
import Link from 'next/link';
import AgentBrandNotice from '../_components/AgentBrandNotice';

export const metadata: Metadata = {
  title: '隐私政策 - 先知命理网',
  description: '先知命理网隐私政策，了解我们如何保护您的个人信息和隐私安全。',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="text-xs tracking-[0.2em] text-gray-500 mb-2">PRIVACY POLICY</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">隐私政策</h1>
          <p className="text-gray-600">最后更新日期：2026年7月31日</p>
        </div>

        {/* 代理商授权声明 */}
        <AgentBrandNotice type="legal" />

        {/* 引言 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <p className="text-gray-700 leading-relaxed">
            先知命理网（以下简称"我们"）深知个人信息对您的重要性，我们将按照法律法规的要求，采取相应的安全保护措施，
            努力保护您的个人信息安全可控。鉴于此，我们制定了本《先知命理网隐私政策》（下称"本政策"），特向您说明
            在使用先知命理网相关服务时，我们如何收集、使用、保存和保护您的个人信息。
          </p>
        </div>

        {/* 1. 我们收集的信息 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. 我们收集的信息</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">1.1 您主动提供的信息</h3>
              <ul className="text-sm text-gray-600 space-y-2 pl-5 list-disc">
                <li><strong>账号信息：</strong>当您注册账号时，我们会收集您的用户名、密码、邮箱地址或手机号码。</li>
                <li><strong>排盘信息：</strong>当您使用排盘服务时，我们会收集您输入的姓名、性别、出生日期、出生时间、出生地等信息。</li>
                <li><strong>付费信息：</strong>当您购买付费服务时，我们会收集订单信息、支付方式等（支付数据由第三方支付平台直接处理，我们不存储完整的银行卡信息）。</li>
                <li><strong>沟通信息：</strong>当您与客服沟通时，我们会记录您的沟通内容以提供更好的服务。</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">1.2 自动收集的信息</h3>
              <ul className="text-sm text-gray-600 space-y-2 pl-5 list-disc">
                <li><strong>设备信息：</strong>我们会收集您的设备型号、操作系统、浏览器类型等信息，用于优化您的使用体验。</li>
                <li><strong>日志信息：</strong>当您访问我们的网站时，我们会记录您的IP地址、访问时间、浏览页面等日志信息。</li>
                <li><strong>Cookie 信息：</strong>我们会使用Cookie来记录您的登录状态、偏好设置等信息。</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">1.3 我们不收集的信息</h3>
              <ul className="text-sm text-gray-600 space-y-2 pl-5 list-disc">
                <li>我们不会收集您的身份证号码、银行卡密码等敏感信息。</li>
                <li>我们不会强制要求您上传真实照片或进行实名认证。</li>
                <li>排盘信息中的出生数据仅用于计算命理结果，不会与您的真实身份关联（除非您主动绑定）。</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. 信息的使用 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. 信息的使用</h2>
          <ul className="text-sm text-gray-600 space-y-3 pl-5 list-disc">
            <li><strong>提供服务：</strong>使用您的排盘信息计算命理结果，提供测算服务。</li>
            <li><strong>账号管理：</strong>用于账号注册、登录、身份验证和账号安全保护。</li>
            <li><strong>优化体验：</strong>分析用户访问数据，优化网站功能和用户体验。</li>
            <li><strong>安全防护：</strong>检测异常访问行为，防范欺诈、诈骗等违法活动。</li>
            <li><strong>沟通服务：</strong>向您发送服务通知、订单状态更新等（您可随时关闭）。</li>
          </ul>
          <p className="text-sm text-gray-500 mt-4">
            ⚠️ 我们承诺：不会将您的个人信息用于本政策所述目的之外的其他用途。
          </p>
        </div>

        {/* 3. 信息的保护 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. 信息的保护</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>我们重视您的个人信息安全，采用以下技术和管理措施来保护您的信息：</p>
            <ul className="space-y-2 pl-5 list-disc">
              <li><strong>加密传输：</strong>全站采用HTTPS加密协议，确保数据传输安全。</li>
              <li><strong>加密存储：</strong>敏感信息（如密码）采用哈希加密存储，无法被还原。</li>
              <li><strong>访问控制：</strong>严格限制个人信息的访问权限，仅授权人员可访问。</li>
              <li><strong>数据隔离：</strong>排盘数据与用户账号数据隔离存储，避免数据关联。</li>
              <li><strong>定期审查：</strong>定期进行安全审计和漏洞扫描，及时修复潜在风险。</li>
            </ul>
          </div>
        </div>

        {/* 4. 信息的共享 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. 信息的共享</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>我们不会将您的个人信息出售给任何第三方。仅在以下情况，我们可能会共享您的信息：</p>
            <ul className="space-y-2 pl-5 list-disc">
              <li><strong>服务提供商：</strong>与为我们提供支付、云存储等服务的合作伙伴共享必要信息，但要求其严格遵守保密义务。</li>
              <li><strong>法律要求：</strong>根据法律法规或政府主管部门的强制要求，我们可能需要提供您的信息。</li>
              <li><strong>您授权：</strong>在您明确同意的情况下，我们才会向第三方共享您的信息。</li>
            </ul>
          </div>
        </div>

        {/* 5. 您的权利 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. 您的权利</h2>
          <ul className="text-sm text-gray-600 space-y-3 pl-5 list-disc">
            <li><strong>查询权：</strong>您可以随时查询您的个人信息和排盘记录。</li>
            <li><strong>更正权：</strong>您可以更正不准确的个人信息。</li>
            <li><strong>删除权：</strong>您可以删除您的账号和所有相关数据（排盘记录将一并删除）。</li>
            <li><strong>撤回同意：</strong>您可以撤回之前给予的授权同意。</li>
            <li><strong>注销账号：</strong>您可以随时注销账号，注销后所有数据将被永久删除。</li>
          </ul>
        </div>

        {/* 6. Cookie 使用 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. Cookie 的使用</h2>
          <p className="text-sm text-gray-600 mb-3">
            我们使用Cookie来提升您的使用体验，主要包括：
          </p>
          <ul className="text-sm text-gray-600 space-y-2 pl-5 list-disc">
            <li>保持您的登录状态</li>
            <li>记住您的偏好设置（如字号、主题等）</li>
            <li>分析网站访问数据以优化服务</li>
          </ul>
          <p className="text-sm text-gray-500 mt-3">
            您可以通过浏览器设置拒绝或删除Cookie，但这可能会影响部分功能的正常使用。
          </p>
        </div>

        {/* 7. 政策更新 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. 政策的更新</h2>
          <p className="text-sm text-gray-600">
            我们可能会不定期更新本隐私政策。当政策发生变更时，我们会在网站上发布更新通知，
            并在必要时通过站内消息或邮件通知您。重大变更将采用显著方式提示您。
          </p>
        </div>

        {/* 8. 联系我们 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">8. 联系我们</h2>
          <p className="text-sm text-gray-600 mb-4">
            如果您对本隐私政策有任何疑问、意见或建议，或需要行使您的相关权利，欢迎通过以下方式联系我们：
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
            <p><strong>邮箱：</strong>privacy@mingliwang.com</p>
            <p><strong>工作时间：</strong>工作日 9:00 - 18:00</p>
            <p>我们会在收到您的请求后15个工作日内给予回复。</p>
          </div>
        </div>

        {/* 导航链接 */}
        <div className="text-center mt-10">
          <Link href="/" className="text-sm text-red-700 hover:text-red-900 font-medium">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}