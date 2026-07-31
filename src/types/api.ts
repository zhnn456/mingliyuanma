/**
 * API 契约类型定义
 * 
 * 定义前后端通信所需的输入/输出类型
 */

// ============================================
// 认证相关类型
// ============================================

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'agent' | 'user';
    name?: string;
    avatar?: string;
  };
  token: string;
}

// ============================================
// 代理商相关类型
// ============================================

export interface CreateAgentInput {
  contactName: string;
  contactPhone: string;
  email?: string;
  plan?: 'basic' | 'pro' | 'enterprise';
  maxUsers?: number;
}

export interface UpdateAgentInput {
  contactName?: string;
  contactPhone?: string;
  email?: string;
  isActive?: boolean;
  plan?: 'basic' | 'pro' | 'enterprise';
  maxUsers?: number;
}

export interface AgentWithStats {
  id: string;
  contactName: string;
  contactPhone: string;
  email: string;
  isActive: boolean;
  plan: string;
  maxUsers: number;
  usedUsers: number;
  totalOrders: number;
  totalRevenue: number;
  commissionRate: number;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 授权码相关类型
// ============================================

export interface CreateLicenseInput {
  agentId: string;
  type: 'single' | 'batch';
  maxUsers?: number;
  validDays?: number;
  count?: number;
}

export interface BatchCreateLicenseInput {
  agentId: string;
  count: number;
  maxUsers?: number;
  validDays?: number;
}

export interface SignedLicenseOutput {
  licenseKey: string;
  signature: string;
  expiresAt: string;
  maxUsers: number;
}

// ============================================
// 分页相关类型
// ============================================

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ============================================
// 结算相关类型
// ============================================

export interface CreateSettlementInput {
  agentId: string;
  period: string;
  items: {
    orderId: string;
    amount: number;
    commissionRate: number;
    commissionAmount: number;
  }[];
}

// ============================================
// 分润相关类型
// ============================================

export interface CalculateCommissionInput {
  agentId: string;
  orderId: string;
  orderAmount: number;
  orderType: 'service' | 'product' | 'package';
}

export interface CommissionResult {
  agentId: string;
  orderId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  level: 1 | 2;
  timestamp: string;
}
