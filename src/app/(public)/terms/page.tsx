import type { Metadata } from 'next';
import { getBrandName, getBrandConfig } from '@/lib/brand';
import Link from 'next/link';
import AgentBrandNotice from '../_components/AgentBrandNotice';

export const revalidate = 60; // 品牌名等动态元数据定期重新生成（ISR）
export async function generateMetadata(): Promise<Metadata> {
  const brandName = await getBrandName();
  return {
  title: '服务条款',
  description: `${brandName}服务条款，了解使用我们文化解读服务的相关规定和条件。`,
  };
}

export default async function TermsPage() {
  const brand = await getBrandConfig();
  const brandName = brand.brandName;
  const supportEmail = brand.supportEmail;
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="text-xs tracking-[0.2em] text-gray-500 mb-2">TERMS OF SERVICE</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">服务条款</h1>
          <p className="text-gray-600">最后更新日期：2026年8月24日</p>
        </div>

        {/* 代理商授权声明 */}
        <AgentBrandNotice type="legal" />

        {/* 重要提示 */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-amber-900 mb-3">⚠️ 重要声明</h2>
          <p className="text-sm text-amber-800 leading-relaxed">
            {brandName}提供的所有文化解读服务（包括但不限于八字排盘、紫微斗数、奇门遁甲、梅花易数等）仅供娱乐参考。
            解读内容基于传统文化整理，不应作为人生重大决策的依据。请您理性看待解读内容，切勿沉迷或迷信。
            本网站不对因过度依赖测算结果而做出的任何决定承担责任。
          </p>
        </div>

        {/* 1. 服务说明 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. 服务说明</h2>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">1.1 服务内容</h3>
              <p>{brandName}为用户提供以下在线文化解读服务：</p>
              <ul className="mt-2 pl-5 list-disc space-y-1">
                <li>四柱八字排盘与分析</li>
                <li>紫微斗数排盘与解读</li>
                <li>奇门遁甲排盘与用神分析</li>
                <li>梅花易数起卦与卦象解读</li>
                <li>其他命理相关工具和知识查询</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">1.2 服务性质</h3>
              <ul className="pl-5 list-disc space-y-1">
                <li>本网站所有解读内容均由计算机算法自动生成，不保证100%准确</li>
                <li>命理分析结果仅作文化娱乐用途，不构成任何建议或指导</li>
                <li>用户应自行判断测算结果的参考价值</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">1.3 服务变更</h3>
              <ul className="pl-5 list-disc space-y-1">
                <li>我们保留在提前公告的前提下，调整、暂停或终止部分或全部服务的权利</li>
                <li>服务调整影响您已购买权益的，我们将采取相应合理措施（如延长有效期、退款等）保障您的权益</li>
                <li>本条不排除法律及本协议规定我们应承担的责任</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. 用户注册与使用 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. 用户注册与使用</h2>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">2.1 账号注册</h3>
              <ul className="pl-5 list-disc space-y-1">
                <li>您需要提供有效的邮箱地址和密码来注册账号</li>
                <li>您应保证注册信息的真实性和准确性</li>
                <li>每个用户仅可注册一个账号</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">2.2 账号安全</h3>
              <ul className="pl-5 list-disc space-y-1">
                <li>您应妥善保管账号和密码，因您自身原因导致账号泄露的，我们不承担责任</li>
                <li>如发现账号异常，应立即通知我们</li>
                <li>账号所有权归注册人所有，不得以任何方式转让</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">2.3 用户行为规范</h3>
              <p>您在使用本网站服务时，不得进行以下行为：</p>
              <ul className="mt-2 pl-5 list-disc space-y-1">
                <li>违反国家法律法规</li>
                <li>利用系统漏洞获取不当利益</li>
                <li>对网站进行攻击、破坏或干扰</li>
                <li>恶意注册账号或刷单</li>
                <li>传播虚假、有害信息</li>
                <li>其他损害网站或第三方利益的行为</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">2.4 未成年人保护</h3>
              <ul className="pl-5 list-disc space-y-1">
                <li>本网站服务面向18周岁及以上成年人</li>
                <li>我们重视未成年人合法权益保护。如您是未成年人，请在监护人指导下使用本网站，请勿注册账号或进行任何付费操作</li>
                <li>监护人应妥善保管支付工具，防止未成年人误操作充值</li>
                <li>如监护人发现未成年人未经其同意使用本服务或进行充值，可通过下方联系方式告知我们，我们将依法核实并协助处理（包括但不限于暂停相关账号、按退款政策处理等）</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 3. 付费服务 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. 付费服务</h2>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">3.1 付费内容</h3>
              <ul className="pl-5 list-disc space-y-1">
                <li>深度命理解读报告</li>
                <li>高级排盘功能解锁</li>
                <li>专家在线咨询服务</li>
                <li>其他付费增值服务</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">3.2 支付方式</h3>
              <ul className="pl-5 list-disc space-y-1">
                <li>支持微信支付、支付宝等主流支付方式</li>
                <li>支付过程由第三方支付平台处理，我们不存储您的支付信息</li>
                <li>支付完成后，服务内容将立即生效</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">3.3 积分充值与使用规则</h3>
              <ul className="pl-5 list-disc space-y-1">
                <li>积分为本平台虚拟货币，1元人民币 = 10积分</li>
                <li>积分仅限在本平台内用于排盘解读、祈福、合盘等功能消费</li>
                <li>积分不可提现、不可转账、不可兑换人民币或其他货币</li>
                <li>积分不可跨平台使用，不同代理商站点之间积分余额独立计算</li>
                <li>充值成功后积分即时到账，如遇延迟请联系客服处理</li>
                <li>积分账户余额长期有效，暂无过期时间限制</li>
                <li>请确认充值金额后再支付，因用户自身操作失误导致的误充值，平台不承担责任</li>
                <li>如发现利用漏洞非法获取积分，平台有权冻结相关账户及积分余额</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">3.4 退款政策</h3>
              <ul className="pl-5 list-disc space-y-1">
                <li>已消费的积分不支持退款</li>
                <li>未使用的积分余额可申请退款，将在3个工作日内原路退回</li>
                <li>如因系统故障导致服务无法使用，我们将根据实际情况处理退款</li>
                <li>退款申请需在购买后7天内提出</li>
                <li>特殊情况请联系客服协商处理</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">3.5 会员与订阅（无自动续费）</h3>
              <p className="mb-2">为避免误解，特此说明：</p>
              <ul className="pl-5 list-disc space-y-1">
                <li>本站会员均为一次性付费购买，<strong>不涉及自动续费</strong>，不会在未经您确认的情况下自动扣除任何费用</li>
                <li>会员有效期以您购买时页面上展示的时长为准，到期后如需继续使用请自行再次购买</li>
                <li>若未来我们上线自动续费功能的订阅服务，将提前单独向您明示并在扣费前提供取消途径</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. 知识产权 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. 知识产权</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>{brandName}的所有内容，包括但不限于：</p>
            <ul className="pl-5 list-disc space-y-1">
              <li>网站设计、页面布局</li>
              <li>程序代码、算法逻辑</li>
              <li>命理解读文字内容</li>
              <li>图形、Logo、图标等视觉素材</li>
              <li>数据库结构和数据内容</li>
            </ul>
            <p>除依据适用开源协议授权使用的内容外，上述内容的知识产权归{brandName}运营方所有，受《中华人民共和国著作权法》及相关法律法规保护。</p>
            <p className="mt-3 bg-gray-50 p-3 rounded">
              <strong>特别说明：</strong>本站部分功能参考了GitHub上的开源项目算法逻辑，我们遵循相应开源协议（如 MIT、Apache-2.0 等之约定）使用并履行保留版权声明等义务，上述开源组件的知识产权归其原作者所有，具体致谢请参见
              <Link href="/copyright" className="text-red-700 hover:text-red-900 underline">《版权声明》</Link>页面。
            </p>
          </div>
        </div>

        {/* 5. 免责声明 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. 免责声明</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="bg-gray-50 p-3 rounded">
              <strong>承诺：</strong>本条免责声明不排除、亦不限制法律明确要求我们必须承担的责任。因我们故意或重大过失造成您损失的，我们依法承担相应责任。除法律另有规定外，在可依法排除责任的范围内，我们对以下情形不承担责任：
            </p>
            <ul className="pl-5 list-disc space-y-2">
              <li><strong>解读内容准确性：</strong>解读内容基于传统文化整理，可能存在误差，我们不保证内容的绝对准确性和完整性，相关内容仅供娱乐参考。</li>
              <li><strong>用户决策损失：</strong>因用户依据解读内容做出的任何决策而导致的损失。</li>
              <li><strong>服务中断：</strong>因不可抗力或非我们可控的原因导致的服务中断，但我们将尽力尽快恢复。</li>
              <li><strong>信息泄露：</strong>因用户自身原因（如密码保管不善）导致的个人信息泄露。</li>
              <li><strong>第三方行为：</strong>因第三方（包括其他用户、网络攻击等）的行为导致的损失。</li>
              <li><strong>间接损失：</strong>在法律允许的范围内，对与本服务相关的间接损失，包括但不限于利润损失、业务中断等，予以排除。</li>
            </ul>
          </div>
        </div>

        {/* 6. 用户内容 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. 用户内容</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>您在使用本网站服务时产生的内容（如排盘记录、咨询记录等）：</p>
            <ul className="pl-5 list-disc space-y-1">
              <li>您享有您所创建内容的知识产权</li>
              <li>您授权我们在提供服务的范围内使用这些内容</li>
              <li>您的排盘记录默认为您私有，不会公开</li>
              <li>如您选择公开分享，需遵守相关规定</li>
            </ul>
          </div>
        </div>

        {/* 7. 违反处理 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. 违反处理</h2>
          <p className="text-sm text-gray-600">
            如您违反本服务条款的任何规定，我们有权视情节严重程度采取以下措施：
          </p>
          <ul className="mt-3 pl-5 list-disc text-sm text-gray-600 space-y-1">
            <li>警告通知</li>
            <li>限制账号功能</li>
            <li>冻结或注销账号</li>
            <li>追究法律责任</li>
          </ul>
        </div>

        {/* 8. 条款更新 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">8. 条款更新</h2>
          <p className="text-sm text-gray-600">
            我们可能会不定期更新本服务条款。当条款发生重大变更时，我们会在网站上发布显著通知，并以适当方式提示您。
            如您在条款更新后继续使用本网站服务，即表示您已阅读并同意更新后的条款。建议您定期查看本条款以了解最新内容。
          </p>
        </div>

        {/* 9. 联系我们 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">9. 联系我们</h2>
          <p className="text-sm text-gray-600">
            如您对本服务条款或我们的服务有任何疑问，欢迎通过以下方式联系我们：
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm mt-3 space-y-2">
            <p><strong>邮箱：</strong>{supportEmail}</p>
            <p><strong>工作时间：</strong>工作日 9:00 - 18:00</p>
          </div>
        </div>

        {/* 10. 适用法律与争议解决 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">10. 适用法律与争议解决</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>本服务条款的解释、执行与争议解决均适用中华人民共和国法律。</p>
            <p>因本服务条款或您使用本网站服务产生的争议，双方应首先友好协商解决；协商不成的，任何一方均可依法向运营方所在地有管辖权的人民法院提起诉讼。</p>
            <p>本服务条款任何条款被认定无效或不可执行的，不影响其他条款的效力。</p>
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