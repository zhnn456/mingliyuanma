'use client';

import { useState, useEffect } from 'react';

export default function AdminVersionsPage() {
  const [configs, setConfigs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/config').then(r => r.json()).then(d => {
      if (d.configs) setConfigs(d.configs.filter((c: any) => c.category === 'version'));
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-6">版本管理</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500 text-sm mb-4">当前排盘引擎和各模块版本信息</p>
        <div className="space-y-3">
          {[
            ['排盘引擎', '1.0.0', '基于 iztro 库，支持八字/紫微/奇门/梅花'],
            ['积分系统', '1.0.0', '注册赠分、每日签到、排盘消耗'],
            ['优惠券系统', '1.0.0', '固定金额/百分比折扣码'],
            ['支付系统', '1.0.0', 'Mock 支付，支持微信/支付宝接入'],
            ['数据库', 'D1', '全部迁移至 raw D1 API'],
          ].map(([name, ver, desc]) => (
            <div key={name} className="flex items-center justify-between py-3 border-b">
              <div>
                <div className="font-medium text-gray-900">{name}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">v{ver}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-xl">
          <h3 className="font-bold text-gray-900 text-sm mb-2">📋 更新计划</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• 积分充值功能（微信/支付宝购买积分）</li>
            <li>• 排盘消耗积分自动扣减</li>
            <li>• 优惠券在支付页面的 UI 输入入口</li>
            <li>• 消息通知系统（订单通知、到期提醒）</li>
            <li>• 数据导出（用户、订单、收入报表）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
