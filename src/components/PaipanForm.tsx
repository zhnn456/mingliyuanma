'use client';

import { useState } from 'react';
import { CITIES, calcSolarTimeOffset, applySolarTimeCorrection } from '@/lib/cities';

interface PaipanFormProps {
  onSubmit: (data: {
    name: string;
    gender: string;
    year: number;
    month: number;
    day: number;
    hour: number;
    isLunar: boolean;
    birthCity: string;
    trueSolarTime: boolean;
  }) => void;
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

export function PaipanForm({ onSubmit, loading, title, submitText = '开始排盘' }: PaipanFormProps) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [hourIndex, setHourIndex] = useState(0);
  const [gender, setGender] = useState('male');
  const [isLunar, setIsLunar] = useState(false);
  const [birthCity, setBirthCity] = useState('');
  const [trueSolarTime, setTrueSolarTime] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);
    if (!y || !m || !d) { alert('请填写完整的出生日期'); return; }
    if (y < 1900 || y > 2100) { alert('年份请在1900-2100之间'); return; }

    // 计算实际小时（子时是23点）
    let hour = hourIndex === 0 ? 23 : hourIndex * 2 - 1;

    // 真太阳时校正
    if (trueSolarTime && birthCity) {
      const city = CITIES.find(c => c.name === birthCity);
      if (city) {
        const offset = calcSolarTimeOffset(city.longitude);
        const baseDate = new Date(y, m - 1, d, hour === 23 ? 0 : hour, 0);
        const corrected = applySolarTimeCorrection(baseDate, offset);
        hour = corrected.getHours();
      }
    }

    onSubmit({ name, gender, year: y, month: m, day: d, hour, isLunar, birthCity, trueSolarTime });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {title && (
        <h3 className="text-center text-lg font-bold text-gray-800">{title}</h3>
      )}

      {/* 姓名 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">姓名（选填）</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="请输入姓名"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* 日期类型切换 */}
      <div className="flex items-center justify-center space-x-4">
        <button
          type="button"
          onClick={() => setIsLunar(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !isLunar ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          公历
        </button>
        <button
          type="button"
          onClick={() => setIsLunar(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isLunar ? 'bg-red-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          农历
        </button>
      </div>

      {/* 出生日期 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">年</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="如: 1990"
            min="1900"
            max="2100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">月</label>
          <input
            type="number"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="1-12"
            min="1"
            max="12"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">日</label>
          <input
            type="number"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            placeholder="1-31"
            min="1"
            max="31"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* 出生时辰 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">出生时辰</label>
        <select
          value={hourIndex}
          onChange={(e) => setHourIndex(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          {hours.map((h) => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>
      </div>

      {/* 性别 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
        <div className="flex space-x-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="male"
              checked={gender === 'male'}
              onChange={(e) => setGender(e.target.value)}
              className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
            />
            <span className="ml-2 text-gray-700">男（乾造）</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="female"
              checked={gender === 'female'}
              onChange={(e) => setGender(e.target.value)}
              className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
            />
            <span className="ml-2 text-gray-700">女（坤造）</span>
          </label>
        </div>
      </div>

      {/* 出生地 & 真太阳时 */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">真太阳时校正</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">出生城市</label>
            <select
              value={birthCity}
              onChange={(e) => setBirthCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">请选择城市</option>
              {CITIES.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}（经度 {city.longitude}°，校正 {city.offset > 0 ? '+' : ''}{city.offset}分钟）
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              根据出生地经度校正真太阳时，提高排盘精度
            </p>
          </div>
        )}
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '排盘中...' : submitText}
      </button>
    </form>
  );
}
