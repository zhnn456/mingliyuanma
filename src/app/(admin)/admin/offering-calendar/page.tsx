'use client';

import { useState, useEffect, useCallback } from 'react';

type CalendarItem = {
  id?: string;
  itemName: string;
  userName: string;
  userEmail?: string;
  type: string;
  amount: number;
  status?: string;
  createdAt?: string;
  startDate?: string;
  endDate?: string | null;
};

type CalendarDay = {
  date: string;
  count: number;
  totalAmount: number;
  items: CalendarItem[];
};

type Stats = {
  totalActiveOfferings: number;
  totalThisMonth: number;
  totalAmountThisMonth: number;
  dailyAvg: number;
  daysInMonth: number;
};

const typeLabels: Record<string, string> = {
  single: '单次',
  monthly: '包月',
  yearly: '包年',
};

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function OfferingCalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalActiveOfferings: 0,
    totalThisMonth: 0,
    totalAmountThisMonth: 0,
    dailyAvg: 0,
    daysInMonth: 30,
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
      });
      const res = await fetch(`/api/admin/offering-calendar?${params}`);
      if (res.ok) {
        const d = await res.json();
        setDays(d.days || []);
        if (d.stats) setStats(d.stats);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  };

  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
    setSelectedDate(null);
  };

  // 构造日历网格
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysMap = new Map<string, CalendarDay>();
  for (const d of days) {
    daysMap.set(d.date, d);
  }

  const cells: Array<{ day: number; date: string; data?: CalendarDay } | null> = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, date: dateStr, data: daysMap.get(dateStr) });
  }
  // 补齐到 7 的倍数
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  })();

  const selectedDay = selectedDate ? daysMap.get(selectedDate) : null;

  const statCards = [
    { label: '本月供奉数', value: stats.totalThisMonth, color: 'text-slate-900' },
    { label: '本月金额', value: `¥${Number(stats.totalAmountThisMonth || 0).toFixed(2)}`, color: 'text-amber-700' },
    { label: '活跃供奉', value: stats.totalActiveOfferings, color: 'text-green-700' },
    { label: '日均供奉', value: stats.dailyAvg, color: 'text-blue-700' },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900">排期日历</h1>
        <p className="text-[13px] text-slate-500 mt-1">按日历查看每月供奉记录分布情况</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 日历主体 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-4">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
            >
              ‹ 上个月
            </button>
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold text-gray-900">
                {year} 年 {month} 月
              </div>
              <button
                onClick={goToday}
                className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
              >
                回到今天
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
            >
              下个月 ›
            </button>
          </div>

          {/* 星期表头 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEK_DAYS.map((w, i) => (
              <div
                key={w}
                className={`text-center text-xs py-2 font-medium ${
                  i === 0 || i === 6 ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 日期单元格 */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="min-h-[80px] bg-gray-50/50 rounded" />;
              }
              const isToday = cell.date === todayStr;
              const isSelected = cell.date === selectedDate;
              const hasData = !!cell.data;
              return (
                <button
                  key={cell.date}
                  onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                  className={`min-h-[80px] p-1.5 rounded border text-left flex flex-col text-xs transition-colors ${
                    isSelected
                      ? 'border-red-600 bg-red-50'
                      : isToday
                      ? 'border-amber-400 bg-amber-50/50'
                      : hasData
                      ? 'border-gray-200 bg-white hover:bg-amber-50/40'
                      : 'border-gray-100 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`font-medium ${
                      isToday ? 'text-amber-700' : hasData ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {cell.day}
                  </div>
                  {hasData && (
                    <div className="mt-auto space-y-0.5">
                      <div className="text-[10px] text-amber-700 font-medium">
                        {cell.data!.count} 笔
                      </div>
                      <div className="text-[10px] text-gray-600">
                        ¥{Number(cell.data!.totalAmount).toFixed(0)}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 当日详情侧栏 */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">
              {selectedDate ? `${selectedDate} 详情` : '请选择日期'}
            </h3>
            {selectedDay && (
              <span className="text-xs text-gray-500">
                共 {selectedDay.count} 笔 · ¥{Number(selectedDay.totalAmount).toFixed(2)}
              </span>
            )}
          </div>

          {!selectedDate && (
            <div className="py-10 text-center text-sm text-gray-400">
              点击左侧日历中的日期查看供奉详情
            </div>
          )}

          {selectedDate && !selectedDay && (
            <div className="py-10 text-center text-sm text-gray-400">
              该日期暂无供奉记录
            </div>
          )}

          {selectedDay && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {selectedDay.items.map((it, idx) => (
                <div
                  key={it.id || idx}
                  className="border rounded-lg p-3 bg-amber-50/30 hover:bg-amber-50/60"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-gray-900 text-sm">
                      {it.itemName}
                    </div>
                    <div className="font-bold text-amber-700 text-sm">
                      ¥{Number(it.amount).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>{it.userName}</div>
                    <div>{typeLabels[it.type] || it.type}</div>
                  </div>
                  {it.createdAt && (
                    <div className="text-[11px] text-gray-400 mt-1">
                      {new Date(it.createdAt).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow text-sm text-gray-600">加载中...</div>
        </div>
      )}
    </div>
  );
}
