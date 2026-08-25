import type { Metadata } from 'next';
import { getBrandName, getBrandConfig } from '@/lib/brand';
import Link from 'next/link';
import AgentBrandNotice from '../_components/AgentBrandNotice';

export const revalidate = 60; // 品牌名等动态元数据定期重新生成（ISR）
export async function generateMetadata(): Promise<Metadata> {
  const brandName = await getBrandName();
  return {
  title: '隐私政策',
  description: `${brandName}隐私政策，了解我们如何保护您的个人信息和隐私安全。`,
  };
}

export default async function PrivacyPage() {
  const brand = await getBrandConfig();
  const brandName = brand.brandName;
  const supportEmail = brand.supportEmail;
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="text-xs tracking-[0.2em] text-gray-500 mb-2">PRIVACY POLICY</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">隐私政策</h1>
          <p className="text-gray-600">最后更新日期：2026年8月24日</p>
        </div>

        {/* 代理商授权声明 */}
        <AgentBrandNotice type="legal" />

        {/* 引言 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <p className="text-gray-700 leading-relaxed">
            {brandName}（以下简称"我们"）深知个人信息对您的重要性，我们将按照法律法规的要求，采取相应的安全保护措施，
            努力保护您的个人信息安全可控。鉴于此，我们制定了本《{brandName}隐私政策》（下称"本政策"），特向您说明
            在使用{brandName}相关服务时，我们如何收集、使用、保存和保护您的个人信息。
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
                <li><strong>排盘信息（含敏感个人信息）：</strong>当您使用排盘服务时，我们会收集您输入的姓名、性别、出生日期、出生时间、出生地等信息。这类信息可间接识别您的生活背景，属于与您个人紧密相关的内容。我们仅在您主动填写并提交排盘的场景下收集，且仅用于生成相应的传统文化解读内容。<strong>如需使用此功能，请您单独确认同意本政策对该类信息的处理；您也可以选择不提供完整出生信息。</strong></li>
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
                <li>我们不会收集您的身份证号码、银行卡密码等严重敏感信息。</li>
                <li>我们不会强制要求您上传真实照片或进行实名认证。</li>
                <li>排盘记录（含出生数据）仅用于生成传统文化解读内容，并仅用于向您的账号提供历史记录查询服务；未经您同意，我们不会将排盘信息用于与本服务无关的其他用途。</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. 信息的使用 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. 信息的使用</h2>
          <ul className="text-sm text-gray-600 space-y-3 pl-5 list-disc">
            <li><strong>提供服务：</strong>使用您的排盘信息生成解读内容，提供文化解读服务。</li>
            <li><strong>账号管理：</strong>用于账号注册、登录、身份验证和账号安全保护。</li>
            <li><strong>优化体验：</strong>分析用户访问数据，优化网站功能和用户体验。</li>
            <li><strong>安全防护：</strong>检测异常访问行为，防范欺诈、诈骗等违法活动。</li>
            <li><strong>沟通服务：</strong>向您发送服务通知、订单状态更新等（您可随时关闭）。</li>
          </ul>
          <p className="text-sm text-gray-500 mt-4">
            ⚠️ 我们承诺：不会将您的个人信息用于本政策所述目的之外的其他用途。
          </p>
          <div className="mt-4 bg-gray-50 p-3 rounded">
            <h3 className="font-semibold text-gray-800 mb-2">2.1 个性化与自动化决策说明</h3>
            <p className="text-sm text-gray-600">
              排盘解读内容由计算机算法根据您提供的出生信息自动生成，属于自动化决策的一种。
              但此类决策仅用于生成参考性解读，<strong>不构成对您的信用、交易能力等个人权益产生重大影响的决策</strong>，也不会据此对您进行商品或服务的推广排序。
              目前我们<strong>不使用您的个人信息进行个性化广告推送</strong>。如未来推出个性化推荐功能，我们将另行告知并为您提供关闭途径。
            </p>
          </div>
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

        {/* 4.1 第三方服务与 SDK */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">4.1 第三方服务与 SDK</h2>
          <p className="text-sm text-gray-600 mb-3">为向您提供服务，我们可能接入以下第三方服务。第三方会依据其自身的隐私政策处理您的信息，我们建议您同时了解：</p>
          <ul className="text-sm text-gray-600 space-y-2 pl-5 list-disc">
            <li><strong>第三方支付：</strong>微信支付、支付宝等支付渠道。当您完成支付时，相关订单与支付信息将转由相应支付平台按其服务条款处理。</li>
            <li><strong>文字与图标素材：</strong>本网站使用的部分字体、图标资源（如 Noto Serif SC 字体、Lucide React 图标等）来自第三方开源项目，引用时不会向这些项目传输您的个人信息。</li>
            <li><strong>数据分析：</strong>如我们接入第三方统计与分析工具，将仅用于改善网站体验，且会遵循最小必要原则。具体请以接入时页面提示为准。</li>
          </ul>
        </div>

        {/* 5. 您的权利 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. 您的权利</h2>
          <ul className="text-sm text-gray-600 space-y-3 pl-5 list-disc">
            <li><strong>查询权：</strong>您可以随时查询您的个人信息和排盘记录（登录后在个人中心查看）。</li>
            <li><strong>更正权：</strong>您可以更正不准确的个人信息（登录后在个人中心修改）。</li>
            <li><strong>删除权：</strong>您可以删除您的账号和所有相关数据（排盘记录将一并删除）。</li>
            <li><strong>撤回同意：</strong>您可以撤回之前给予的授权同意（如不再使用排盘功能，可删除相关排盘记录）。</li>
            <li><strong>注销账号：</strong>您可以随时注销账号，注销后所有数据将被永久删除。</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            <strong>权利行使方式：</strong>您可通过账号"个人中心/设置"自助办理查询、更正、删除与注销；也可以通过下方邮箱提交请求，我们将在15个工作日内处理并回复。
          </p>
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
            您可以通过浏览器设置拒绝或删除Cookie，但这可能会影响部分功能的正常使用。您也可以采用"无痕/隐私窗口"访问本网站，以减少本地留存记录。
          </p>
        </div>

        {/* 6.1 未成年人的个人信息保护 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">6.1 未成年人的个人信息保护</h2>
          <p className="text-sm text-gray-600">
            本网站服务面向18周岁及以上成年人。我们特别重视未成年人个人信息保护：如您为不满14周岁的未成年人，请勿向我们提供任何个人信息或注册账号。
            如监护人发现未成年人在未取得您同意的情况下使用了本服务并提供了个人信息，可通过下方联系方式联系我们，我们将依法及时删除相关个人信息并采取必要措施。
          </p>
        </div>

        {/* 7. 政策更新 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. 政策的更新</h2>
          <p className="text-sm text-gray-600">
            我们可能会不定期更新本隐私政策。当政策发生变更时，我们会在网站上发布更新通知，
            并在必要时通过站内消息或邮件通知您。重大变更将采用显著方式提示您，并在更新后于页面顶部显示新的"最后更新日期"。
          </p>
        </div>

        {/* 8. 联系我们 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">8. 联系我们</h2>
          <p className="text-sm text-gray-600 mb-4">
            如果您对本隐私政策有任何疑问、意见或建议，或需要行使您的相关权利，欢迎通过以下方式联系我们：
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
            <p><strong>运营主体：</strong>{brandName}</p>
            <p><strong>邮箱：</strong>{supportEmail}</p>
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