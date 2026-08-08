import type { Metadata } from 'next';
import Link from 'next/link';
import AgentBrandNotice from '../_components/AgentBrandNotice';

export const metadata: Metadata = {
  title: '版权声明 - 命理网',
  description: '命理网版权声明，了解网站内容的知识产权归属和使用规定。',
};

export default function CopyrightPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment-50 via-paper to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="text-xs tracking-[0.2em] text-gray-500 mb-2">COPYRIGHT</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">版权声明</h1>
          <p className="text-gray-600">最后更新日期：2026年7月31日</p>
        </div>

        {/* 代理商授权声明 */}
        <AgentBrandNotice type="legal" />

        {/* 版权信息 */}
        <div className="bg-gradient-to-br from-red-50 to-amber-50 rounded-2xl shadow-sm border border-red-100 p-8 mb-6 text-center">
          <div className="text-4xl mb-4">©</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">命理网 MingLiWang</h2>
          <p className="text-gray-600 mb-4">传承千年智慧 · 融合现代科技</p>
          <p className="text-sm text-gray-500">本网站所有内容受相关法律法规保护</p>
        </div>

        {/* 1. 版权归属 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. 版权归属</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              命理网（域名：bazi6.cc.cd）的所有内容，除非另有说明，其知识产权均归命理网运营团队所有，
              受《中华人民共和国著作权法》《中华人民共和国知识产权法》及相关国际条约的保护。
            </p>
            <p>受版权保护的内容包括但不限于：</p>
            <ul className="pl-5 list-disc space-y-1">
              <li>网站整体设计、页面布局、视觉风格</li>
              <li>所有程序代码、算法逻辑、数据库结构</li>
              <li>命理解读的原创文字内容</li>
              <li>网站使用的图形、Logo、图标、动画等视觉素材</li>
              <li>网站使用的字体、音乐、音效等多媒体内容</li>
              <li>其他构成网站的所有元素</li>
            </ul>
          </div>
        </div>

        {/* 2. 禁止行为 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. 禁止行为</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>未经命理网书面授权，任何单位和个人不得以任何形式使用本网站内容，包括但不限于：</p>
            <ul className="pl-5 list-disc space-y-2">
              <li><strong>复制转载：</strong>未经授权将本网站内容复制、转载到其他平台</li>
              <li><strong>商业使用：</strong>将本网站内容用于任何商业目的</li>
              <li><strong>反向工程：</strong>对本网站进行反编译、反汇编或其他逆向工程</li>
              <li><strong>镜像镜像：</strong>未经授权对本网站进行镜像或镜像站点搭建</li>
              <li><strong>恶意采集：</strong>通过爬虫、机器人等方式批量采集本网站内容</li>
              <li><strong>修改篡改：</strong>修改、篡改本网站内容或去除版权声明</li>
            </ul>
          </div>
        </div>

        {/* 3. 合理使用 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. 合理使用</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>在以下情况下，您可以在注明出处的前提下有限使用本网站内容：</p>
            <ul className="pl-5 list-disc space-y-2">
              <li><strong>个人学习：</strong>为个人学习、研究目的引用本网站内容</li>
              <li><strong>学术研究：</strong>在学术论文、报告中引用本网站的观点或数据</li>
              <li><strong>媒体报道：</strong>新闻媒体在报道中引用本网站公开信息</li>
              <li><strong>评论说明：</strong>在评论、介绍本网站时引用少量文字或图片</li>
            </ul>
            <p className="bg-gray-50 p-3 rounded mt-3">
              <strong>注明要求：</strong>合理使用时，请注明"出处：命理网（bazi6.cc.cd）"。
            </p>
          </div>
        </div>

        {/* 4. 开源致谢 */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-sm border border-amber-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-amber-900 mb-4">4. 开源项目致谢</h2>
          <div className="space-y-4 text-sm text-amber-900">
            <p>
              命理网的开发过程中，参考和借鉴了以下 GitHub 开源项目的算法逻辑和实现思路。
              在此向所有开源社区贡献者表示最诚挚的感谢！
            </p>

            <div className="bg-white/70 rounded-lg p-4 space-y-3">
              <div className="border-b border-amber-100 pb-3">
                <h3 className="font-bold text-gray-800">🌐 qimen-dunjia</h3>
                <p className="text-xs text-gray-500">奇门遁甲排盘算法</p>
                <p className="text-xs text-gray-600 mt-1">参考其起卦逻辑、九宫布局、用神分析等核心算法实现</p>
              </div>
              <div className="border-b border-amber-100 pb-3">
                <h3 className="font-bold text-gray-800">⭐ ziwei-doushu</h3>
                <p className="text-xs text-gray-500">紫微斗数排盘算法</p>
                <p className="text-xs text-gray-600 mt-1">参考其十二宫位计算、星曜分布、四化飞星等算法逻辑</p>
              </div>
              <div className="border-b border-amber-100 pb-3">
                <h3 className="font-bold text-gray-800">🏛️ bazi-paipan</h3>
                <p className="text-xs text-gray-500">四柱八字排盘算法</p>
                <p className="text-xs text-gray-600 mt-1">参考其干支计算、五行旺衰、十神分析等计算方法</p>
              </div>
              <div className="border-b border-amber-100 pb-3">
                <h3 className="font-bold text-gray-800">📅 chinese-calendar</h3>
                <p className="text-xs text-gray-500">中国传统历法计算</p>
                <p className="text-xs text-gray-600 mt-1">参考其农历转换、节气计算、干支纪年等功能实现</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">☯️ bagua-utils</h3>
                <p className="text-xs text-gray-500">八卦分析工具库</p>
                <p className="text-xs text-gray-600 mt-1">参考其卦象解析、爻辞查询、体用分析等功能逻辑</p>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-xs text-red-800">
                💡 <strong>声明：</strong>本站仅参考上述开源项目的算法思路，未直接复制其源代码。
                所有算法实现均经过重新设计与优化。相关开源项目的知识产权归其原作者所有。
                如需查看原项目，请访问 GitHub 搜索相关关键词。
              </p>
            </div>
          </div>
        </div>

        {/* 5. 第三方内容 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. 第三方内容</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              本网站可能包含指向第三方网站的链接或嵌入第三方内容（如字体、图标等）。
              这些第三方内容的知识产权归其各自所有者所有。
            </p>
            <ul className="pl-5 list-disc space-y-1">
              <li><strong>字体：</strong>本站使用了 Google Fonts 提供的 Noto Serif SC 字体，遵循 SIL Open Font License</li>
              <li><strong>图标：</strong>本站部分图标来自 Lucide React，遵循 ISC License</li>
              <li><strong>其他：</strong>第三方内容的知识产权归其原作者所有</li>
            </ul>
          </div>
        </div>

        {/* 6. 侵权投诉 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. 侵权投诉</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              如果您是某作品的权利人，认为本网站上的内容侵犯了您的合法权益，请通过以下方式联系我们。
              我们会在收到投诉后15个工作日内进行核实和处理。
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">投诉邮箱：copyright@mingliwang.com</h3>
              <p className="text-xs text-gray-500 mb-3">投诉时请提供以下信息：</p>
              <ul className="text-xs text-gray-600 space-y-1 pl-5 list-disc">
                <li>权利人身份证明</li>
                <li>侵权作品的具体位置（URL）</li>
                <li>侵权的具体说明和证据</li>
                <li>联系方式</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 7. 法律声明 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. 法律声明</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              本版权声明的最终解释权归命理网运营团队所有。本声明的制定、执行和解释均适用中华人民共和国法律。
              如因本声明产生争议，双方应友好协商解决；协商不成的，任何一方均可向命理网所在地有管辖权的人民法院提起诉讼。
            </p>
          </div>
        </div>

        {/* 联系我们 */}
        <div className="bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-4">联系我们</h2>
          <p className="text-sm opacity-90 mb-4">如有任何版权相关问题，欢迎随时联系我们：</p>
          <div className="space-y-2 text-sm">
            <p>📧 邮箱：copyright@mingliwang.com</p>
            <p>💬 微信公众号：命理网</p>
            <p>🕐 工作时间：工作日 9:00 - 18:00</p>
          </div>
        </div>

        {/* 导航链接 */}
        <div className="text-center mt-10 space-x-4">
          <Link href="/" className="text-sm text-red-700 hover:text-red-900 font-medium">
            ← 返回首页
          </Link>
          <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            关于我们
          </Link>
          <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            隐私政策
          </Link>
          <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            服务条款
          </Link>
        </div>
      </div>
    </div>
  );
}