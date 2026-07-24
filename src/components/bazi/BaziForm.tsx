'use client';

import { useState } from 'react';

interface BaziFormProps {
  onSubmit: (data: {
    year: number;
    month: number;
    day: number;
    hour: number;
    gender: string;
    isLunar: boolean;
  }) => void;
  loading: boolean;
}

const hours = Array.from({ length: 12 }, (_, i) => ({
  value: i * 2 + (i === 0 ? 23 : -1),
  label: ['子时 (23-1点)', '丑时 (1-3点)', '寅时 (3-5点)', '卯时 (5-7点)',
          '辰时 (7-9点)', '巳时 (9-11点)', '午时 (11-13点)', '未时 (13-15点)',
          '申时 (15-17点)', '酉时 (17-19点)', '戌时 (19-21点)', '亥时 (21-23点)'][i],
}));

export function BaziForm({ onSubmit, loading }: BaziFormProps) {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [hourIndex, setHourIndex] = useState(0);
  const [gender, setGender] = useState('male');
  const [isLunar, setIsLunar] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);
    
    if (!y || !m || !d) {
      alert('请填写完整的出生日期');
      return;
    }
    
    if (y < 1900 || y > 2100) {
      alert('年份请在1900-2100之间');
      return;
    }
    
    if (m < 1 || m > 12) {
      alert('月份请在1-12之间');
      return;
    }
    
    if (d < 1 || d > 31) {
      alert('日期请在1-31之间');
      return;
    }

    // 计算实际小时（子时是23点）
    const hour = hourIndex === 0 ? 23 : hourIndex * 2 - 1;

    onSubmit({
      year: y,
      month: m,
      day: d,
      hour,
      gender,
      isLunar,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 日期类型切换 */}
      <div className="flex items-center justify-center space-x-4">
        <button
          type="button"
          onClick={() => setIsLunar(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !isLunar
              ? 'bg-red-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          公历
        </button>
        <button
          type="button"
          onClick={() => setIsLunar(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isLunar
              ? 'bg-red-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          农历
        </button>
      </div>

      {/* 出生日期 */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isLunar ? '农历年' : '出生年'}
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder={isLunar ? '如: 1990' : '如: 1990'}
            min="1900"
            max="2100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isLunar ? '农历月' : '月'}
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isLunar ? '农历日' : '日'}
          </label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          出生时辰
        </label>
        <select
          value={hourIndex}
          onChange={(e) => setHourIndex(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          {hours.map((h, i) => (
            <option key={i} value={i}>
              {h.label}
            </option>
          ))}
        </select>
      </div>

      {/* 性别 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          性别
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="male"
              checked={gender === 'male'}
              onChange={(e) => setGender(e.target.value)}
              className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
            />
            <span className="ml-2 text-gray-700">男</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="female"
              checked={gender === 'female'}
              onChange={(e) => setGender(e.target.value)}
              className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
            />
            <span className="ml-2 text-gray-700">女</span>
          </label>
        </div>
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '排盘中...' : '开始排盘'}
      </button>
    </form>
  );
}
