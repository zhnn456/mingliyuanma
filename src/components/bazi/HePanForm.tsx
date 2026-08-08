'use client';

import { useState } from 'react';

interface HePanFormProps {
  onSubmit: (person1: any, person2: any) => void;
  loading?: boolean;
}

// 年份范围 1940-2010
const YEARS = Array.from({ length: 2010 - 1940 + 1 }, (_, i) => 1940 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const HOURS = [
  { value: 0, label: '子时 (23-1点)' },
  { value: 1, label: '丑时 (1-3点)' },
  { value: 2, label: '寅时 (3-5点)' },
  { value: 3, label: '卯时 (5-7点)' },
  { value: 4, label: '辰时 (7-9点)' },
  { value: 5, label: '巳时 (9-11点)' },
  { value: 6, label: '午时 (11-13点)' },
  { value: 7, label: '未时 (13-15点)' },
  { value: 8, label: '申时 (15-17点)' },
  { value: 9, label: '酉时 (17-19点)' },
  { value: 10, label: '戌时 (19-21点)' },
  { value: 11, label: '亥时 (21-23点)' },
];

interface PersonState {
  year: string;
  month: string;
  day: string;
  hourIndex: number;
  gender: 'male' | 'female';
  isLunar: boolean;
  isLeapMonth: boolean;
}

const defaultPerson = (gender: 'male' | 'female'): PersonState => ({
  year: '1990',
  month: '1',
  day: '1',
  hourIndex: 0,
  gender,
  isLunar: false,
  isLeapMonth: false,
});

/** 单人表单 */
function PersonForm({
  label,
  accent,
  state,
  onChange,
}: {
  label: string;
  accent: 'male' | 'female';
  state: PersonState;
  onChange: (next: PersonState) => void;
}) {
  const update = <K extends keyof PersonState>(key: K, val: PersonState[K]) =>
    onChange({ ...state, [key]: val });

  const accentText = accent === 'male' ? 'text-blue-700' : 'text-rose-700';
  const accentBg =
    accent === 'male'
      ? 'from-blue-50 to-white border-blue-200'
      : 'from-rose-50 to-white border-rose-200';
  const accentBtn =
    accent === 'male'
      ? 'from-blue-700 to-blue-900 border-blue-800'
      : 'from-rose-700 to-rose-900 border-rose-800';

  return (
    <div className={`rounded-2xl border bg-gradient-to-b ${accentBg} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className={`text-base font-bold ${accentText}`}>{label}</h4>
        <span className="text-xs text-gray-400">{state.isLunar ? '农历' : '公历'}</span>
      </div>

      {/* 公历/农历切换 */}
      <div className="flex justify-center mb-4">
        <div className="toggle-group">
          <button
            type="button"
            onClick={() => update('isLunar', false)}
            className={`toggle-btn ${!state.isLunar ? 'active' : ''}`}
          >
            公历
          </button>
          <button
            type="button"
            onClick={() => update('isLunar', true)}
            className={`toggle-btn ${state.isLunar ? 'active' : ''}`}
          >
            农历
          </button>
        </div>
      </div>

      {/* 年月日 */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="form-label text-xs">{state.isLunar ? '农历年' : '年'}</label>
          <select
            value={state.year}
            onChange={(e) => update('year', e.target.value)}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label text-xs">月</label>
          <select
            value={state.month}
            onChange={(e) => update('month', e.target.value)}
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label text-xs">日</label>
          <select
            value={state.day}
            onChange={(e) => update('day', e.target.value)}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 出生时辰 */}
      <div className="mb-3">
        <label className="form-label text-xs">出生时辰</label>
        <select
          value={state.hourIndex}
          onChange={(e) => update('hourIndex', parseInt(e.target.value))}
        >
          {HOURS.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>
      </div>

      {/* 闰月选项（农历时显示） */}
      {state.isLunar && (
        <div className="flex items-center space-x-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 mb-3">
          <input
            type="checkbox"
            id={`leap-${accent}`}
            checked={state.isLeapMonth}
            onChange={(e) => update('isLeapMonth', e.target.checked)}
            className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
          />
          <label htmlFor={`leap-${accent}`} className="text-sm text-amber-800 cursor-pointer">
            闰月（如出生在农历闰月请勾选）
          </label>
        </div>
      )}

      {/* 性别 */}
      <div>
        <label className="form-label text-xs">性别</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => update('gender', 'male')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${
              state.gender === 'male'
                ? `bg-gradient-to-br ${accentBtn} text-white shadow-md`
                : 'bg-white text-gray-600 border-parchment-300 hover:border-parchment-400'
            }`}
          >
            男（乾造）
          </button>
          <button
            type="button"
            onClick={() => update('gender', 'female')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${
              state.gender === 'female'
                ? `bg-gradient-to-br ${accentBtn} text-white shadow-md`
                : 'bg-white text-gray-600 border-parchment-300 hover:border-parchment-400'
            }`}
          >
            女（坤造）
          </button>
        </div>
      </div>
    </div>
  );
}

export function HePanForm({ onSubmit, loading }: HePanFormProps) {
  const [person1, setPerson1] = useState<PersonState>(defaultPerson('male'));
  const [person2, setPerson2] = useState<PersonState>(defaultPerson('female'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const buildPayload = (p: PersonState) => {
      const y = parseInt(p.year);
      const m = parseInt(p.month);
      const d = parseInt(p.day);
      // 子时(0) → 23点，其余时辰按 hourIndex*2-1 推算
      const hour = p.hourIndex === 0 ? 23 : p.hourIndex * 2 - 1;
      return {
        year: y,
        month: m,
        day: d,
        hour,
        gender: p.gender,
        isLunar: p.isLunar,
        isLeapMonth: p.isLunar ? p.isLeapMonth : undefined,
        hourType: p.hourIndex === 0 ? ('late-zi' as const) : undefined,
        paipanType: 'bazi',
      };
    };

    onSubmit(buildPayload(person1), buildPayload(person2));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-5 items-stretch">
        <PersonForm
          label="男方信息"
          accent="male"
          state={person1}
          onChange={setPerson1}
        />

        {/* 中间图标 */}
        <div className="flex md:flex-col items-center justify-center md:py-4">
          <div className="relative">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-200">
              <span className="text-2xl md:text-3xl text-white font-bold">合</span>
            </div>
            <div className="absolute -top-1 -right-1 text-lg">❤</div>
          </div>
        </div>

        <PersonForm
          label="女方信息"
          accent="female"
          state={person2}
          onChange={setPerson2}
        />
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
            合盘中...
          </span>
        ) : (
          '开始合盘'
        )}
      </button>
    </form>
  );
}
