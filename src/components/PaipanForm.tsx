'use client';

import { useState, useMemo } from 'react';
import { CITIES, calcSolarTimeOffset, applySolarTimeCorrection } from '@/lib/cities';
import type { PaipanFormData } from '@/types';

interface PaipanFormProps {
  onSubmit: (data: PaipanFormData) => void;
  loading: boolean;
  title?: string;
  submitText?: string;
}

const hours = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: ['子时 (23-1点)', '丑时 (1-3点)', '寅时 (3-5点)', '卯时 (5-7点)',
          '辰时 (7-9点)', '巳时 (9-11点)', '午时 (11-13点)', '未时 (13-15点)',
          '申时 (15-17点)', '酉时 (17-19点)', '戌时 (19-21点)', '亥时 (21-23点)'][i],
}));

// 中国夏令时年份（1986-1991）
const DST_YEARS = [1986, 1987, 1988, 1989, 1990, 1991];
function isDST(year: number, month: number, day: number): boolean {
  if (!DST_YEARS.includes(year)) return false;
  if (month < 5 || month > 9) return false;
  if (month > 5 && month < 9) return true;
  if (month === 5) {
    const firstDay = new Date(year, 4, 1).getDay();
    const firstSunday = firstDay === 0 ? 1 : 8 - firstDay;
    return day >= firstSunday;
  }
  if (month === 9) {
    const firstDay = new Date(year, 8, 1).getDay();
    const firstSunday = firstDay === 0 ? 1 : 8 - firstDay;
    const thirdSunday = firstSunday + 14;
    return day <= thirdSunday;
  }
  return false;
}

export function PaipanForm({ onSubmit, loading, title, submitText = '开始排盘' }: PaipanFormProps) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [hourIndex, setHourIndex] = useState(0);
  const [unknownHour, setUnknownHour] = useState(false);
  const [hourType, setHourType] = useState<'early-zi' | 'late-zi'>('early-zi');
  const [gender, setGender] = useState('male');
  const [isLunar, setIsLunar] = useState(false);
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [birthCity, setBirthCity] = useState('');
  const [trueSolarTime, setTrueSolarTime] = useState(true);

  const dstWarning = useMemo(() => {
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);
    if (!y || !m || !d) return null;
    if (isDST(y, m, d)) {
      return '检测到出生日期处于中国夏令时期间（1986-1991年），系统已自动校正为真太阳时（减去1小时）。';
    }
    return null;
  }, [year, month, day]);

  const isZiHour = hourIndex === 0 && !unknownHour;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);
    if (!y || !m || !d) { alert('请填写完整的出生日期'); return; }
    if (y < 1900 || y > 2100) { alert('年份请在1900-2100之间'); return; }

    let hour: number | null = null;

    if (!unknownHour) {
      hour = hourIndex === 0 ? 23 : hourIndex * 2 - 1;

      if (isZiHour) {
        if (hourType === 'early-zi') {
          hour = 0;
        } else {
          hour = 23;
        }
      }

      if (dstWarning) {
        hour = hour - 1;
        if (hour < 0) hour = 23;
      }

      if (trueSolarTime && birthCity) {
        const city = CITIES.find(c => c.name === birthCity);
        if (city) {
          const offset = calcSolarTimeOffset(city.longitude);
          const baseDate = new Date(y, m - 1, d, hour, 0);
          const corrected = applySolarTimeCorrection(baseDate, offset);
          hour = corrected.getHours();
        }
      }
    }

    onSubmit({
      name,
      gender,
      year: y,
      month: m,
      day: d,
      hour,
      hourType: isZiHour ? hourType : undefined,
      isLunar,
      isLeapMonth: isLunar ? isLeapMonth : undefined,
      birthCity,
      trueSolarTime,
      paipanType: 'bazi',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {title && (
        <h3 className="text-center text-xl font-bold text-gray-800 font-kai">{title}</h3>
      )}

      {/* 姓名和性别 - 同一行 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="form-label">姓名（选填）</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入姓名"
            className="w-full"
          />
        </div>
        <div>
          <label className="form-label">性别</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all border ${
                gender === 'male'
                  ? 'bg-gradient-to-br from-red-700 to-red-900 text-white border-red-800 shadow-md'
                  : 'bg-white text-gray-600 border-parchment-300 hover:border-parchment-400'
              }`}
            >
              男（乾造）
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all border ${
                gender === 'female'
                  ? 'bg-gradient-to-br from-red-700 to-red-900 text-white border-red-800 shadow-md'
                  : 'bg-white text-gray-600 border-parchment-300 hover:border-parchment-400'
              }`}
            >
              女（坤造）
            </button>
          </div>
        </div>
      </div>

      {/* 日期类型切换 */}
      <div className="flex justify-center">
        <div className="toggle-group">
          <button
            type="button"
            onClick={() => setIsLunar(false)}
            className={`toggle-btn ${!isLunar ? 'active' : ''}`}
          >
            公历
          </button>
          <button
            type="button"
            onClick={() => setIsLunar(true)}
            className={`toggle-btn ${isLunar ? 'active' : ''}`}
          >
            农历
          </button>
        </div>
      </div>

      {/* 出生日期 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="form-label">年</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="如: 1990"
            min="1900"
            max="2100"
            required
          />
        </div>
        <div>
          <label className="form-label">月</label>
          <input
            type="number"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="1-12"
            min="1"
            max="12"
            required
          />
        </div>
        <div>
          <label className="form-label">日</label>
          <input
            type="number"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            placeholder="1-31"
            min="1"
            max="31"
            required
          />
        </div>
      </div>

      {/* 农历闰月选项 */}
      {isLunar && (
        <div className="flex items-center space-x-3 p-4 bg-amber-50/60 rounded-xl border border-amber-200/60">
          <input
            type="checkbox"
            id="leapMonth"
            checked={isLeapMonth}
            onChange={(e) => setIsLeapMonth(e.target.checked)}
            className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
          />
          <label htmlFor="leapMonth" className="text-sm text-amber-800 cursor-pointer">
            闰月（如出生在农历闰月请勾选）
          </label>
        </div>
      )}

      {/* 出生时辰 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label !mb-0">出生时辰</label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={unknownHour}
              onChange={(e) => setUnknownHour(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="ml-2 text-sm text-gray-600">未知时辰</span>
          </label>
        </div>
        {!unknownHour ? (
          <>
            <select
              value={hourIndex}
              onChange={(e) => setHourIndex(parseInt(e.target.value))}
            >
              {hours.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
            {isZiHour && (
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 mb-3 font-medium">子时早晚区分（影响日柱归属）</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setHourType('early-zi')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm text-left transition-all border ${
                      hourType === 'early-zi'
                        ? 'bg-red-700 text-white border-red-800'
                        : 'bg-white text-gray-700 border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="font-medium">早子时</div>
                    <div className="text-xs opacity-80 mt-0.5">00:00-01:00 · 日柱用当天</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHourType('late-zi')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm text-left transition-all border ${
                      hourType === 'late-zi'
                        ? 'bg-red-700 text-white border-red-800'
                        : 'bg-white text-gray-700 border-amber-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="font-medium">晚子时</div>
                    <div className="text-xs opacity-80 mt-0.5">23:00-24:00 · 时柱属次日</div>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 leading-relaxed">
              已选择「未知时辰」，将以<strong>三柱论命</strong>模式排盘。
              三柱（年月日）仍可分析格局、用神、大运，但时柱相关内容（子女宫、时柱十神等）将不显示。
            </p>
          </div>
        )}
      </div>

      {/* 夏令时提示 */}
      {dstWarning && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <p className="text-sm text-orange-800 flex items-start">
            <span className="font-bold mr-1">夏令时提示：</span>
            {dstWarning}
          </p>
        </div>
      )}

      {/* 出生地 & 真太阳时 */}
      <div className="border-t border-parchment-200 pt-5">
        <div className="flex items-center justify-between mb-3">
          <label className="form-label !mb-0">真太阳时校正</label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={trueSolarTime}
              onChange={(e) => setTrueSolarTime(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="ml-2 text-sm text-gray-600">启用</span>
          </label>
        </div>
        {trueSolarTime && (
          <div>
            <select
              value={birthCity}
              onChange={(e) => setBirthCity(e.target.value)}
            >
              <option value="">请选择城市</option>
              {CITIES.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}（经度 {city.longitude}°，校正 {city.offset > 0 ? '+' : ''}{city.offset}分钟）
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              根据出生地经度校正真太阳时，提高排盘精度
            </p>
          </div>
        )}
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            排盘中...
          </span>
        ) : (
          submitText
        )}
      </button>
    </form>
  );
}
