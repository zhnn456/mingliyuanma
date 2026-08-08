'use client';

import { useEffect, useState } from 'react';

interface AgentBrand {
  brandName: string;
  logo: string | null;
  isActive: boolean;
}

/**
 * 代理商品牌授权声明组件
 * 在法律信息页面顶部显示代理商的授权声明
 * 如果没有代理商信息（主站环境），则不显示
 */
export default function AgentBrandNotice({ type = 'legal' }: { type?: 'legal' | 'about' }) {
  const [agent, setAgent] = useState<AgentBrand | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/public/agent-brand')
      .then(res => res.json())
      .then(data => {
        if (data.agent) setAgent(data.agent);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // 未加载完成或没有代理商信息时不显示
  if (!loaded || !agent) return null;

  const brandName = agent.brandName;

  // 根据页面类型显示不同的授权声明
  const notices: Record<string, string> = {
    legal: `${brandName}为命理网授权合作站点，使用命理网提供的测算技术与平台服务。本页面所述法律条款同时适用于本站，由命理网与${brandName}共同遵守。`,
    about: `${brandName}为命理网授权合作站点，使用命理网提供的测算技术与平台服务。以下内容为命理网平台统一介绍，${brandName}在此基础上为您提供本地化服务。`,
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-3">
        {agent.logo && (
          <img src={agent.logo} alt={brandName} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        )}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">授权站点</span>
            <span className="font-bold text-blue-900">{brandName}</span>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed">
            {notices[type]}
          </p>
        </div>
      </div>
    </div>
  );
}
