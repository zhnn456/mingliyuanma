'use client';

/**
 * 客服二维码组件 — 在充值/支付相关页面右侧展示
 * 引导用户扫码添加客服微信进行充值和咨询
 */
export default function CustomerServiceQR() {
  return (
    <aside className="hidden lg:block w-60 flex-shrink-0">
      <div className="sticky top-24">
        <div className="bg-white rounded-xl border border-stone-200 p-5 text-center shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">扫码添加客服</h3>
          <div className="w-40 h-40 mx-auto mb-4 rounded-xl overflow-hidden border-2 border-stone-100">
            <img
              src="/images/qr-customer-service.jpg"
              alt="客服二维码"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-gray-500 mb-3">微信/支付宝正在配置中</p>
          <div className="border-t border-stone-100 pt-3">
            <p className="text-xs text-gray-600 font-medium">充值 · 购买卡密 · 咨询</p>
            <p className="text-xs text-gray-400 mt-1">请扫码联系客服</p>
          </div>
        </div>
      </div>
    </aside>
  );
}