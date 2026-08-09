'use client';

import { useState, useEffect } from 'react';

interface BrandInfo {
  brandName: string;
  logo: string | null;
  isActive: boolean;
}

const DEFAULT_BRAND: BrandInfo = {
  brandName: '先知命理网',
  logo: null,
  isActive: true,
};

/**
 * 获取当前站点品牌信息
 * 代理商子站：从 API 获取品牌名称和 Logo
 * 主站：返回默认值"先知命理网"
 */
export function useBrand() {
  const [brand, setBrand] = useState<BrandInfo>(DEFAULT_BRAND);
  const [isAgentSite, setIsAgentSite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/agent-brand')
      .then(res => res.json())
      .then(data => {
        if (data.agent) {
          setBrand(data.agent);
          setIsAgentSite(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { brand, isAgentSite, loading };
}
