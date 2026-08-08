'use client';

import { useState, useRef, useEffect } from 'react';
import { CITIES, CITY_REGIONS, CityData } from '@/lib/cities';

interface CityPickerProps {
  value: string;
  onChange: (city: string) => void;
}

export default function CityPicker({ value, onChange }: CityPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>('中国');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedCity = CITIES.find(c => c.name === value);
  const regionCities = CITIES.filter(c => c.region === activeRegion);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-lg hover:border-amber-400 focus:outline-none focus:border-amber-500 transition-colors flex items-center justify-between"
      >
        <span className={selectedCity ? 'text-gray-800' : 'text-gray-400'}>
          {selectedCity
            ? `${selectedCity.name}${selectedCity.nameEn ? ' ' + selectedCity.nameEn : ''}（${selectedCity.offset > 0 ? '+' : ''}${selectedCity.offset}分钟）`
            : '请选择城市'}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[200] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-[28rem] overflow-hidden flex flex-col">
          {/* 地区标签页 */}
          <div className="flex border-b border-gray-100 overflow-x-auto px-1 pt-1 flex-shrink-0">
            {CITY_REGIONS.map(region => (
              <button
                key={region}
                type="button"
                onClick={() => setActiveRegion(region)}
                className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                  activeRegion === region
                    ? 'border-amber-500 text-amber-700 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          {/* 城市网格 */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-3 gap-1">
              {regionCities.map(city => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => {
                    onChange(city.name);
                    setOpen(false);
                  }}
                  className={`px-2 py-2 text-xs rounded text-center transition-colors ${
                    value === city.name
                      ? 'bg-amber-100 text-amber-700 font-medium ring-1 ring-amber-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  title={`${city.nameEn || city.name}（经度 ${city.longitude}°，校正 ${city.offset > 0 ? '+' : ''}${city.offset}分钟）`}
                >
                  <div>{city.name}</div>
                  {city.nameEn && <div className="text-[10px] text-gray-400">{city.nameEn}</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
