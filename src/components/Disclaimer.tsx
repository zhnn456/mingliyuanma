/**
 * 统一免责声明组件 — 解读结果底部展示
 * 合规要求：所有解读/分析内容必须附带"仅供文化娱乐参考"声明
 */
export default function Disclaimer() {
  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500 leading-relaxed">
        ⚠️ 以上内容基于传统命理文化整理，仅供文化研究与娱乐参考，不构成任何现实建议，
        不作为投资、医疗、法律等任何决策依据。请理性看待，切勿沉迷。
      </p>
    </div>
  );
}
