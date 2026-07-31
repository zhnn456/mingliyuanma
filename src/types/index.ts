/**
 * 自动生成的类型定义 - 请勿手动修改数据库类型部分
 * 运行 npm run sync:types 来更新数据库类型
 * 
 * 数据库类型基于 Prisma Schema 生成，与数据库 Schema 保持一致
 * 业务类型（如八字类型、API类型）请在其他文件中定义并在此处导出
 */

// 重新导出业务类型
export * from './bazi';
export * from './api';
export * from './update-log';


// ============================================
// 数据库模型类型（由 sync:types 自动生成）
// ============================================

export interface User {
  email: string;
  passwordHash: string;
  memberLevel: string;
  orders: Order[];
  tickets: Ticket[];
  updatedAt: Date;
}

export interface Agent {
  contactName: string;
  contactPhone: string;
  user: User;
  licenses: AgentLicense[];
  settlements: Settlement[];
  commissionRecords: CommissionRecord[];
  isActive: number;
  updatedAt: Date;
}

export interface AgentLicense {
  agentId: string;
  licenseKey: string;
  maxUsers: number;
  agent: Agent;
  updatedAt: Date;
}

export interface Order {
  userId: string;
  amount: number;
  user: User;
  updatedAt: Date;
}

export interface Settlement {
  agentId: string;
  amount: number;
  agent: Agent;
  updatedAt: Date;
}

export interface CommissionRecord {
  agentId: string;
  orderId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  agent: Agent;
}

export interface Ticket {
  userId: string;
  title: string;
  content: string;
  status: string;
  priority: string;
  user: User;
  updatedAt: Date;
}

export interface UpdateLog {
}

// ============================================
// 通用辅助类型
// ============================================

// API 响应通用类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 查询参数
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// 时间戳
export type Timestamp = string;

// ID 类型
export type ID = string;
