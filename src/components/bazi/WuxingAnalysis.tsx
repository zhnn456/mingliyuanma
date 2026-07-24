'use client';

import { TIAN_GAN_WU_XING } from '@/types';

interface WuxingAnalysisProps {
  wuxing: Record<string, number>;
  xiYongShen: {
    xi: string;
    yong: string;
    ji: string;
  } | null;
}

function getWuxingColor(wuxing: string): string {
  const colorMap: Record<string, string> = {
    '金': '#c8a45c',
    '木': '#2d8c3c',
    '水': '#1a5276',
    '火': '#c41a1a',
    '土': '#8b6914',
  };
  return colorMap[wuxing] || '#666';
}

function getWuxingBg(wuxing: string): string {
  const bgMap: Record<string, string> = {
    '金': 'bg-yellow-100',
    '木': 'bg-green-100',
    '水': 'bg-blue-100',
    '火': 'bg-red-100',
    '土': 'bg-amber-100',
  };
  return bgMap[wuxing] || 'bg-gray-100';
}

export function WuxingAnalysis({ wuxing, xiYongShen }: WuxingAnalysisProps) {
  const total = Object.values(wuxing).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(wuxing));

  return (
    <div className="card">
      <h2 className="card-title">五行分析</h2>

      {/* 五行统计图 */}
      <div className="space-y-4 mb-8">
        {Object.entries(wuxing).map(([wx, count]) => {
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={wx} className="flex items-center">
              <div className="w-12 text-center font-bold" style={{ color: getWuxingColor(wx) }}>
                {wx}
              </div>
              <div className="flex-1 mx-4">
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: getWuxingColor(wx),
                    }}
                  />
                </div>
              </div>
              <div className="w-20 text-right text-sm text-gray-600">
                {count} 个 ({percentage}%)
              </div>
            </div>
          );
        })}
      </div>

      {/* 五行缺失提示 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">五行状况</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(wuxing).map(([wx, count]) => (
            <span
              key={wx}
              className={`px-3 py-1 rounded-full text-sm ${
                count === 0
                  ? 'bg-gray-200 text-gray-500'
                  : `${getWuxingBg(wx)} text-gray-800`
              }`}
            >
              {wx}: {count === 0 ? '缺失' : `${count}个`}
            </span>
          ))}
        </div>
      </div>

      {/* 喜用神 */}
      {xiYongShen && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">喜用神分析</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">喜神</div>
              <div className="text-2xl font-bold" style={{ color: getWuxingColor(xiYongShen.xi) }}>
                {xiYongShen.xi}
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">用神</div>
              <div className="text-2xl font-bold" style={{ color: getWuxingColor(xiYongShen.yong) }}>
                {xiYongShen.yong}
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">忌神</div>
              <div className="text-2xl font-bold" style={{ color: getWuxingColor(xiYongShen.ji) }}>
                {xiYongShen.ji}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
