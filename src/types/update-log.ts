/**
 * 更新日志类型定义
 * 
 * 用于记录系统版本更新、变更内容、操作人等信息
 */

// 更新类型
export type UpdateLogType = 'update' | 'feature' | 'fix' | 'security' | 'hotfix';

// 更新状态
export type UpdateLogStatus = 'success' | 'failed' | 'rolled_back';

// 更新日志记录
export interface UpdateLog {
  id: string;
  version: string;
  title: string;
  content: string;
  type: UpdateLogType;
  isMajor: boolean;
  changes?: ChangeItem[];
  operatorId?: string;
  operatorName?: string;
  tag?: string;
  status: UpdateLogStatus;
  rollbackVersion?: string;
  createdAt: string;
}

// 变更项
export interface ChangeItem {
  type: UpdateLogType;
  title: string;
  description?: string;
  files?: string[];
  breaking?: boolean;
}

// 创建更新日志输入
export interface CreateUpdateLogInput {
  version: string;
  title: string;
  content: string;
  type?: UpdateLogType;
  isMajor?: boolean;
  changes?: ChangeItem[];
  tag?: string;
}

// 回滚操作输入
export interface RollbackInput {
  targetVersion: string;
  reason: string;
}

// 更新日志查询参数
export interface UpdateLogQueryParams {
  page?: number;
  pageSize?: number;
  type?: UpdateLogType;
  status?: UpdateLogStatus;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

// 更新日志响应
export interface UpdateLogResponse {
  logs: UpdateLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 版本信息
export interface VersionInfo {
  current: string;
  latest: string;
  hasUpdate: boolean;
  releaseDate?: string;
  changelog?: ChangeItem[];
}
