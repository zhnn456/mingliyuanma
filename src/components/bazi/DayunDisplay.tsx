'use client';

import { TIAN_GAN_WU_XING, DI_ZHI_WU_XING } from '@/types';

interface DayunDisplayProps {
  dayun: { gan: string; zhi: string; startAge: number }[];
  dayGan?: string;
}

function getWuxingColor(wx: string): string {
  const map: Record<string, string> = { '金': '#c8a45c', '木': '#2d8c3c', '水': '#1a5276', '火': '#c41a1a', '土': '#8b6914' };
  return map[wx] || '#666';
}

function getWuxingBg(wx: string): string {
  const map: Record<string, string> = { '金': 'bg-yellow-100 border-yellow-200', '木': 'bg-green-100 border-green-200', '水': 'bg-blue-100 border-blue-200', '火': 'bg-red-100 border-red-200', '土': 'bg-amber-100 border-amber-200' };
  return map[wx] || 'bg-gray-100 border-gray-200';
}

function getDayunComment(gan: string, zhi: string, dayGan?: string): string {
  const ganWx = TIAN_GAN_WU_XING[gan];
  const zhiWx = DI_ZHI_WU_XING[zhi];
  const dayWx = dayGan ? TIAN_GAN_WU_XING[dayGan] : '';
  
  const sheng: Record<string, string> = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
  const ke: Record<string, string> = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };

  if (!dayWx) return `${ganWx}${zhiWx}运`;

  let comment = '';
  if (sheng[ganWx] === dayWx || sheng[zhiWx] === dayWx) {
    comment = '生扶日主，运势顺遂';
  } else if (ke[ganWx] === dayWx || ke[zhiWx] === dayWx) {
    comment = '克制日主，需防小人';
  } else if (ganWx === dayWx || zhiWx === dayWx) {
    comment = '比助日主，贵人相助';
  } else if (sheng[dayWx] === ganWx || sheng[dayWx] === zhiWx) {
    comment = '日主泄气，注意身体';
  } else {
    comment = '平稳过渡，稳中求进';
  }

  return comment;
}

export function DayunDisplay({ dayun, dayGan }: DayunDisplayProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="card-title mb-0">大运排列</h2>
        <span className="text-xs text-gray-500">每十年一运</span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        大运反映人生各阶段的运势走向，结合流年可推断具体吉凶
      </p>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {dayun.map((dy, index) => {
            const ganWx = TIAN_GAN_WU_XING[dy.gan];
            const zhiWx = DI_ZHI_WU_XING[dy.zhi];
            const endAge = dy.startAge + 9;
            const comment = getDayunComment(dy.gan, dy.zhi, dayGan);
            
            // 判断当前是否在步大运中
            const currentYear = new Date().getFullYear();
            const birthYear = currentYear - (dayun[0]?.startAge || 0) - (index * 10);
            
            return (
              <div
                key={index}
                className={`flex-shrink-0 w-28 rounded-xl border-2 p-3 text-center transition-all hover:shadow-lg ${getWuxingBg(ganWx)}`}
              >
                {/* 年龄段 */}
                <div className="text-xs font-medium text-gray-600 mb-2 bg-white/60 rounded-full py-0.5 px-2">
                  {dy.startAge}~{endAge}岁
                </div>

                {/* 天干 */}
                <div className="text-2xl font-bold mb-0.5" style={{ color: getWuxingColor(ganWx) }}>
                  {dy.gan}
                </div>
                <div className="text-[10px]" style={{ color: getWuxingColor(ganWx) }}>{ganWx}</div>

                {/* 分隔 */}
                <div className="border-t border-gray-300/50 my-2" />

                {/* 地支 */}
                <div className="text-2xl font-bold mb-0.5" style={{ color: getWuxingColor(zhiWx) }}>
                  {dy.zhi}
                </div>
                <div className="text-[10px]" style={{ color: getWuxingColor(zhiWx) }}>{zhiWx}</div>

                {/* 运势简评 */}
                <div className="mt-2 pt-2 border-t border-gray-300/50">
                  <p className="text-[10px] text-gray-600 leading-tight">{comment}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 大运总论 */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-bold text-gray-700 mb-2">大运总论</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          大运每十年转换一次，天干管前五年，地支管后五年。大运天干地支与日主五行的生克关系，决定了这十年的整体运势基调。
          大运吉利时，即使流年不佳也有缓冲；大运不利时，即使流年好也打了折扣。建议结合流年细看每年具体运势。
        </p>
      </div>
    </div>
  );
}
