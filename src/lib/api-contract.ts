/**
 * API 契约层
 * 
 * 设计原则：
 * 1. 所有 API 必须在此定义路由和类型
 * 2. 前端必须通过 apiClient 调用，禁止直接 fetch
 * 3. 后端必须使用这些类型验证输入
 * 4. 类型变更会同时影响前后端，编译时报错
 */

import type {
  User,
  Agent,
  AgentLicense,
  Order,
  Settlement,
  CreateAgentInput,
  UpdateAgentInput,
  AgentWithStats,
  CreateLicenseInput,
  BatchCreateLicenseInput,
  SignedLicenseOutput,
  LoginInput,
  LoginResponse,
  PaginatedResult,
  PaginationQuery,
} from '@/types';

// ============================================
// API 路由定义（单一真理源）
// ============================================

export const API_ROUTES = {
  // 认证
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  
  // 管理后台 - 代理商管理
  admin: {
    agents: {
      list: '/api/admin/agents',
      create: '/api/admin/agents',
      update: '/api/admin/agents',
      delete: '/api/admin/agents',
      toggle: '/api/admin/agents',
      regenerateLicense: '/api/admin/agents',
    },
    licenses: {
      list: '/api/admin/licenses',
      create: '/api/admin/licenses',
      batchCreate: '/api/admin/licenses',
      update: '/api/admin/licenses',
      delete: '/api/admin/licenses',
    },
    settlements: {
      list: '/api/admin/settlements',
      approve: '/api/admin/settlements',
    },
  },
  
  // 代理商后台
  agent: {
    sync: '/api/agent/sync',
    dashboard: '/api/agent/dashboard',
    orders: '/api/agent/orders',
    settlements: '/api/agent/settlements',
    update: '/api/agent/update',
  },
  
  // 授权验证
  license: {
    verify: '/api/license/verify',
  },
  
  // 版本管理
  version: {
    check: '/api/version/check',
    download: '/api/version/download',
    release: '/api/version/release',
  },
} as const;

// ============================================
// API 客户端（前端使用）
// ============================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(this.baseUrl + url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '请求失败');
    }

    return response.json();
  }

  // ============================================
  // 认证 API
  // ============================================

  async login(input: LoginInput): Promise<LoginResponse> {
    return this.request(API_ROUTES.auth.login, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async logout(): Promise<void> {
    await this.request(API_ROUTES.auth.logout, { method: 'POST' });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request(API_ROUTES.auth.me);
  }

  // ============================================
  // 管理后台 - 代理商 API
  // ============================================

  async getAgents(): Promise<{ agents: AgentWithStats[] }> {
    return this.request(API_ROUTES.admin.agents.list);
  }

  async createAgent(input: CreateAgentInput): Promise<{
    agent: Agent;
    credentials: { email: string; password: string };
  }> {
    return this.request(API_ROUTES.admin.agents.create, {
      method: 'POST',
      body: JSON.stringify({ action: 'create', ...input }),
    });
  }

  async updateAgent(agentId: string, input: UpdateAgentInput): Promise<{ agent: Agent }> {
    return this.request(API_ROUTES.admin.agents.update, {
      method: 'PUT',
      body: JSON.stringify({ agentId, ...input }),
    });
  }

  async toggleAgent(agentId: string, isActive: boolean): Promise<{ success: boolean }> {
    return this.request(API_ROUTES.admin.agents.toggle, {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle', agentId, isActive }),
    });
  }

  async deleteAgent(agentId: string): Promise<{ success: boolean }> {
    return this.request(`${API_ROUTES.admin.agents.delete}?id=${agentId}`, {
      method: 'DELETE',
    });
  }

  async regenerateLicense(agentId: string): Promise<{
    agent: Agent;
    licenseKey: string;
    signedLicense: SignedLicenseOutput;
  }> {
    return this.request(API_ROUTES.admin.agents.regenerateLicense, {
      method: 'POST',
      body: JSON.stringify({ action: 'regenerate_license', agentId }),
    });
  }

  // ============================================
  // 管理后台 - 授权码 API
  // ============================================

  async getLicenses(): Promise<{ licenses: AgentLicense[] }> {
    return this.request(API_ROUTES.admin.licenses.list);
  }

  async createLicense(input: CreateLicenseInput): Promise<{ license: AgentLicense }> {
    return this.request(API_ROUTES.admin.licenses.create, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async batchCreateLicenses(input: BatchCreateLicenseInput): Promise<{
    success: boolean;
    keys: string[];
    count: number;
  }> {
    return this.request(API_ROUTES.admin.licenses.batchCreate, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  // ============================================
  // 代理商后台 API
  // ============================================

  async syncAgent(data: {
    license: string;
    agentId: string;
    domain: string;
    version: string;
    status: string;
  }): Promise<{ success: boolean; agentId: string }> {
    return this.request(API_ROUTES.agent.sync, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAgentDashboard(): Promise<{
    stats: {
      totalOrders: number;
      totalRevenue: number;
      todayOrders: number;
      todayRevenue: number;
    };
  }> {
    return this.request(API_ROUTES.agent.dashboard);
  }

  // ============================================
  // 版本 API
  // ============================================

  async checkUpdate(params: {
    license: string;
    current: string;
    domain: string;
  }): Promise<{
    latest: string;
    hasUpdate: boolean;
    changelog?: Array<{
      type: 'feature' | 'improvement' | 'fix';
      content: string;
    }>;
  }> {
    const query = new URLSearchParams(params).toString();
    return this.request(`${API_ROUTES.version.check}?${query}`);
  }
}

// 单例导出
export const apiClient = new ApiClient();

// ============================================
// React Hooks（前端使用）
// ============================================

import { useState, useEffect, useCallback } from 'react';

export function useAgents() {
  const [agents, setAgents] = useState<AgentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiClient.getAgents();
      setAgents(result.agents);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const createAgent = async (input: CreateAgentInput) => {
    const result = await apiClient.createAgent(input);
    await fetchAgents(); // 刷新列表
    return result;
  };

  const toggleAgent = async (agentId: string, isActive: boolean) => {
    await apiClient.toggleAgent(agentId, isActive);
    await fetchAgents(); // 刷新列表
  };

  const deleteAgent = async (agentId: string) => {
    await apiClient.deleteAgent(agentId);
    await fetchAgents(); // 刷新列表
  };

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
    createAgent,
    toggleAgent,
    deleteAgent,
  };
}

export function useLicenses() {
  const [licenses, setLicenses] = useState<AgentLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiClient.getLicenses();
      setLicenses(result.licenses);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const createLicense = async (input: CreateLicenseInput) => {
    const result = await apiClient.createLicense(input);
    await fetchLicenses();
    return result;
  };

  const batchCreateLicenses = async (input: BatchCreateLicenseInput) => {
    const result = await apiClient.batchCreateLicenses(input);
    await fetchLicenses();
    return result;
  };

  return {
    licenses,
    loading,
    error,
    refetch: fetchLicenses,
    createLicense,
    batchCreateLicenses,
  };
}