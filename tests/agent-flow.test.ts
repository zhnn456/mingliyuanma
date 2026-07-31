/**
 * E2E 测试：代理商管理完整流程
 * 
 * 测试目的：
 * 1. 验证管理后台创建代理商 → 前端显示
 * 2. 验证授权码生成 → 代理商 Worker 同步
 * 3. 确保修改不破坏现有功能
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_BASE = process.env.TEST_API_URL || 'http://localhost:8787';

async function fetchApi(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res.json();
}

describe('代理商管理完整流程', () => {
  let adminToken: string;
  let testAgentId: string;
  let testLicenseKey: string;

  beforeAll(async () => {
    // 管理员登录获取 token
    const loginRes = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
      }),
    });
    adminToken = loginRes.token;
  });

  describe('1. 创建代理商', () => {
    it('应该成功创建代理商并返回授权码', async () => {
      const res = await fetchApi('/api/admin/agents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          action: 'create',
          companyName: '测试代理商公司',
          contactName: '测试联系人',
          contactPhone: '13800000001',
          email: `test-agent-${Date.now()}@example.com`,
          domain: `test-agent-${Date.now()}.example.com`,
          brandName: '测试代理商',
          maxUsers: 500,
          durationDays: 365,
          level: 'standard',
          monthlyFee: 299,
        }),
      });

      expect(res.agent).toBeDefined();
      expect(res.agent.id).toMatch(/^agt_/);
      expect(res.credentials).toBeDefined();
      expect(res.credentials.password).toBeDefined();

      testAgentId = res.agent.id;
      testLicenseKey = res.agent.licenseKey;
    });

    it('创建后应该能在列表中找到', async () => {
      const res = await fetchApi('/api/admin/agents', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const found = res.agents.find((a: any) => a.id === testAgentId);
      expect(found).toBeDefined();
      expect(found.brandName).toBe('测试代理商');
    });
  });

  describe('2. 授权码管理', () => {
    it('应该能查看代理商的授权码', async () => {
      const res = await fetchApi('/api/admin/licenses', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const license = res.licenses.find((l: any) => l.agentId === testAgentId);
      expect(license).toBeDefined();
      expect(license.licenseKey).toMatch(/^LIC\./);
      expect(license.status).toBe('active');
    });

    it('应该能批量生成授权码', async () => {
      const res = await fetchApi('/api/admin/licenses', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          count: 3,
          agentId: testAgentId,
          durationDays: 365,
          maxUsers: 500,
        }),
      });

      expect(res.success).toBe(true);
      expect(res.keys).toHaveLength(3);
      expect(res.count).toBe(3);
    });
  });

  describe('3. 授权码验证', () => {
    it('有效授权码应该验证通过', async () => {
      const res = await fetchApi(
        `/api/license/verify?license=${encodeURIComponent(testLicenseKey)}&domain=test-agent.example.com`
      );

      expect(res.valid).toBe(true);
      expect(res.payload).toBeDefined();
      expect(res.payload.agentId).toBe(testAgentId);
    });

    it('无效授权码应该验证失败', async () => {
      const res = await fetchApi(
        `/api/license/verify?license=INVALID_KEY&domain=test.example.com`
      );

      expect(res.valid).toBe(false);
      expect(res.reason).toBeDefined();
    });
  });

  describe('4. 代理商同步', () => {
    it('代理商 Worker 应该能同步状态', async () => {
      const res = await fetchApi('/api/agent/sync', {
        method: 'POST',
        body: JSON.stringify({
          license: testLicenseKey,
          agentId: testAgentId,
          domain: `test-agent-${Date.now()}.example.com`,
          version: 'v4.0.0',
          status: 'online',
        }),
      });

      expect(res.success).toBe(true);
      expect(res.agentId).toBe(testAgentId);
    });

    it('同步后应该能查询代理商状态', async () => {
      const res = await fetchApi(
        `/api/agent/sync?agentId=${testAgentId}&license=${encodeURIComponent(testLicenseKey)}`
      );

      expect(res.agent).toBeDefined();
      expect(res.agent.id).toBe(testAgentId);
    });
  });

  describe('5. 更新代理商', () => {
    it('应该能更新代理商信息', async () => {
      const res = await fetchApi('/api/admin/agents', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          agentId: testAgentId,
          brandName: '更新后的代理商名称',
          siteConfig: {
            maxUsers: 1000,
            customPricing: true,
            whiteLabel: true,
          },
        }),
      });

      expect(res.agent.brandName).toBe('更新后的代理商名称');
    });
  });

  describe('6. 禁用代理商', () => {
    it('应该能禁用代理商', async () => {
      const res = await fetchApi('/api/admin/agents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          action: 'toggle',
          agentId: testAgentId,
          isActive: false,
        }),
      });

      expect(res.success).toBe(true);
    });

    it('禁用后授权码应该失效', async () => {
      const res = await fetchApi(
        `/api/license/verify?license=${encodeURIComponent(testLicenseKey)}`
      );

      expect(res.valid).toBe(false);
    });
  });

  describe('7. 删除代理商', () => {
    it('应该能删除代理商', async () => {
      const res = await fetchApi(`/api/admin/agents?id=${testAgentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.success).toBe(true);
    });

    it('删除后应该从列表中移除', async () => {
      const res = await fetchApi('/api/admin/agents', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const found = res.agents.find((a: any) => a.id === testAgentId);
      expect(found).toBeUndefined();
    });
  });
});

describe('类型一致性检查', () => {
  it('API 返回的数据应该符合类型定义', async () => {
    const res = await fetchApi('/api/admin/agents');
    
    res.agents.forEach((agent: any) => {
      // 检查必需字段
      expect(typeof agent.id).toBe('string');
      expect(typeof agent.userId).toBe('string');
      expect(typeof agent.contactName).toBe('string');
      expect(typeof agent.contactPhone).toBe('string');
      
      // 检查可选字段
      if (agent.domain !== null) {
        expect(typeof agent.domain).toBe('string');
      }
      if (agent.brandName !== null) {
        expect(typeof agent.brandName).toBe('string');
      }
      
      // 检查数字类型
      expect(typeof agent.isActive).toBe('number');
      expect(agent.isActive).toBeGreaterThanOrEqual(0);
      expect(agent.isActive).toBeLessThanOrEqual(1);
    });
  });
});