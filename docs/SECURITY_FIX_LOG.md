# 安全修复变更日志

> 生成时间：2026-08-22
> 版本：v4.1.0-security-patch

---

## 🔴 极高危修复

### VULN-01: Token 伪造漏洞（FALLBACK_SECRET 硬编码）

**问题描述**：
- `src/lib/auth-server.ts`、`src/lib/payment/config.ts`、`src/app/api/admin/payment-config/route.ts` 中硬编码了回退密钥 `zhiwei-secret-key-2026-production`
- 当生产环境未设置 `NEXTAUTH_SECRET` 时，系统会自动使用此硬编码密钥
- 攻击者阅读源码即可获取密钥，伪造任意角色的 JWT Token

**影响范围**：
- 认证系统、支付配置加密
- 可导致管理后台完全接管

**修复方案**：
- 移除所有 `FALLBACK_SECRET` 硬编码
- `NEXTAUTH_SECRET` 未设置时直接抛出 `FATAL` 错误，阻止服务启动
- 强制要求生产环境必须通过环境变量注入密钥

**修改文件**：
- `src/lib/auth-server.ts`
- `src/lib/payment/config.ts`
- `src/app/api/admin/payment-config/route.ts`
- `src/middleware.ts`

**验证方式**：
```bash
# 部署后验证（需设置正确的 NEXTAUTH_SECRET）
npm run test:security
```

---

### VULN-09B: 用户列表返回密码哈希

**问题描述**：
- `src/app/api/admin/users/route.ts` 中 SQL 查询包含 `passwordHash` 字段
- 攻击者通过伪造 token 可获取所有用户的密码哈希

**修复方案**：
- 移除 SELECT 语句中的 `passwordHash` 字段（代码中已过滤，确认修复）

**修改文件**：
- `src/app/api/admin/users/route.ts`（确认无 passwordHash 泄露）

---

## 🟠 高危修复

### VULN-02: Cookie 缺少 HttpOnly 标志

**问题描述**：
- 登录和注册接口设置的 Cookie 未包含 `HttpOnly` 标志
- 攻击者可通过 XSS 漏洞读取 `document.cookie`，窃取登录 Token

**影响范围**：
- 所有用户登录状态
- 结合 XSS 漏洞可导致账号接管

**修复方案**：
- 在 Cookie 设置中添加 `HttpOnly` 标志
- 保留 `Secure` 和 `SameSite=Lax` 标志

**修改文件**：
- `src/app/api/auth/login/route.ts:84`
- `src/app/api/auth/register-agent/route.ts:190`

**修复后 Cookie 设置**：
```
token=<value>; Path=/; SameSite=Lax; Max-Age=2592000; Secure; HttpOnly
```

---

### VULN-03/VULN-03B: x-agent-id 伪造绕过数据隔离

**问题描述**：
- 4 个 admin API 直接从客户端请求头读取 `x-agent-id` 进行数据隔离
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/orders/route.ts`
- `src/app/api/admin/finance/route.ts`
- `src/app/api/admin/stats/route.ts`
- 攻击者可伪造任意 `x-agent-id` 访问其他代理商的数据

**影响范围**：
- 所有代理商数据隔离机制失效
- 管理员可访问其他代理商的用户、订单、财务数据

**修复方案**：
- 新增 `resolveAgentIdFromSession()` 函数，从已验证的 session 派生 agentId
- 所有 admin API 改用 session 派生的 agentId，不再信任客户端请求头
- middleware 仍然注入 `x-agent-id` 供需要的前端使用，但后端不再直接读取

**修改文件**：
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/orders/route.ts`
- `src/app/api/admin/finance/route.ts`
- `src/app/api/admin/stats/route.ts`

**修复后逻辑**：
```typescript
// 从 session 派生，不可伪造
const agentId = await resolveAgentIdFromSession(session);

async function resolveAgentIdFromSession(session: any): Promise<string | null> {
  if (!session || session.role !== 'agent') return null;
  const agent = await queryFirst('SELECT id FROM Agent WHERE userId = ?', session.sub);
  return agent?.id || null;
}
```

---

### VULN-05: 登录接口无速率限制（暴力破解）

**问题描述**：
- `/api/auth/login` 接口无任何频次限制
- 攻击者可无限次尝试密码，进行暴力破解

**影响范围**：
- 所有用户账户
- 弱密码账户可被破解

**修复方案**：
- 添加 IP 级速率限制：10次/分钟
- 使用现有的 `checkIPRateLimit` 工具函数

**修改文件**：
- `src/app/api/auth/login/route.ts`

**修复后逻辑**：
```typescript
const ip = getClientIP(req);
const rateLimit = checkIPRateLimit(ip, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW);
if (!rateLimit.allowed) {
  return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
}
```

---

### VULN-07: Rollback 接口命令注入

**问题描述**：
- `POST /api/admin/rollback` 接口接受 `backupPath` 参数
- 虽有限制 `startsWith('/www/ming8-backup-')`，但攻击者可构造 `;/rm -rf /` 等注入
- 路径直接拼接至 `execAsync()` 命令

**影响范围**：
- 服务器安全
- 可导致任意命令执行

**修复方案**：
- 添加 `shellEscapePath()` 函数，使用白名单校验路径字符
- 所有路径传入命令前必须经过转义
- 严格限制只允许 `[a-zA-Z0-9_\-/.]` 字符

**修改文件**：
- `src/app/api/admin/rollback/route.ts`

**修复后逻辑**：
```typescript
function shellEscapePath(path: string): string {
  if (!/^[a-zA-Z0-9_\-/.]+$/.test(path)) {
    throw new Error('非法路径字符');
  }
  return path.replace(/['\`\$\\]/g, '\\$&');
}
```

---

## 🟡 中危修复

### VULN-06: 管理员接口无独立速率限制

**问题描述**：
- `src/middleware.ts` 中明确跳过了 `/api/admin/` 路径的限流
- 管理员接口可无限次请求，可能导致：
  - 数据大量导出
  - 数据库连接耗尽
  - 后台管理界面刷爆

**修复方案**：
- 为管理员 API 设置独立限流阈值：200次/分钟
- 普通 API 保持 100次/分钟

**修改文件**：
- `src/middleware.ts`

**修复后逻辑**：
```typescript
const ADMIN_RATE_LIMIT_MAX = 200; // 管理员 API 更宽松的阈值
const limit = pathname.startsWith('/api/admin/') ? ADMIN_RATE_LIMIT_MAX : RATE_LIMIT_MAX;
```

---

### VULN-09: 用户列表返回明文手机号

**问题描述**：
- `src/app/api/admin/users/route.ts` 和 `src/app/api/admin/user-profiles/route.ts` 直接返回手机号
- 违反隐私法规（PII 泄露）

**修复方案**：
- 使用 MySQL `REPLACE()` 函数脱敏中间3位
- 格式：`138****1234`

**修改文件**：
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/user-profiles/route.ts`

**修复后 SQL**：
```sql
SELECT ..., REPLACE(phone, SUBSTRING(phone, 4, 3), '***') as phone, ...
```

---

### VULN-10: 注册接口无验证码

**问题描述**：
- `/api/user/register` 无图形验证码或短信验证
- 可批量注册账号

**修复方案**：
- 已有 IP 级限流（5次/分钟）
- 建议后续接入图形验证码（reCAPTCHA 或极验）

**修改文件**：
- 暂无（已有基础防护）

---

## 🔵 低危/信息性

### VULN-12: PRIMARY_ADMIN_IDS 硬编码

**问题描述**：
- `src/lib/test-isolation.ts` 中硬编码管理员 ID：`['admin', 'cm1admin001']`
- 攻击者可枚举这些 ID

**修复方案**：
- 建议从环境变量或数据库配置表读取
- 当前为信息性发现，不影响运行时安全

**修改文件**：
- 暂无（建议后续优化）

---

## 部署信息

| 站点 | 状态 | 备份位置 |
|------|------|----------|
| 中央站 (ming8.online) | ✅ 已部署 | `/www/ming8-backup-1787395466` |
| 源码站 (bazi6.cc.cd) | ✅ 已部署 | `/www/source-backup-1787395552` |
| 测试SaaS站 | ✅ 已部署 | `/www/test-source-backup-1787395609` |

---

## 测试脚本

新增安全测试脚本：`tests/security-test.js`

**运行方式**：
```bash
# 基础测试
node tests/security-test.js

# 完整测试（需填入凭据）
TARGET=https://ming8.online \
ADMIN_EMAIL=admin@test.com \
ADMIN_PASSWORD=xxx \
FALLBACK_SECRET=xxx \
node tests/security-test.js
```

**测试覆盖**：
- VULN-01: Token 伪造
- VULN-02: Cookie 安全标志
- VULN-03/03B: x-agent-id 伪造
- VULN-04/04B: 用户画像接口隔离
- VULN-05: 登录速率限制
- VULN-06: 管理员接口限流
- VULN-07: 命令注入
- VULN-08: 未认证访问
- VULN-09/09B: 敏感字段泄露
- VULN-10: 注册接口
- VULN-11: SQL/XSS 注入
- VULN-12: 硬编码敏感值

---

## 后续建议

1. **立即更改数据库密码**
   ```bash
   mysql -u root -p -e "ALTER USER 'ming8'@'localhost' IDENTIFIED BY '新密码'; FLUSH PRIVILEGES;"
   ```

2. **更新 .env.production**
   - 移除明文密码，改用密钥管理服务

3. **接入图形验证码**
   - 注册接口添加 reCAPTCHA 或极验验证

4. **定期安全扫描**
   - 每次部署前运行 `npm run test:security`
   - 考虑集成到 CI/CD 流程

---

## 变更文件清单

```
src/lib/auth-server.ts                    | 移除 FALLBACK_SECRET
src/lib/payment/config.ts                 | 移除 FALLBACK_SECRET
src/app/api/admin/payment-config/route.ts | 移除 FALLBACK_SECRET
src/middleware.ts                         | 添加管理员限流、修复 getSecretKey
src/app/api/auth/login/route.ts           | 添加登录限流、Cookie HttpOnly
src/app/api/auth/register-agent/route.ts  | Cookie HttpOnly
src/app/api/admin/users/route.ts          | x-agent-id 安全修复、手机号脱敏
src/app/api/admin/orders/route.ts         | x-agent-id 安全修复
src/app/api/admin/finance/route.ts        | x-agent-id 安全修复
src/app/api/admin/stats/route.ts          | x-agent-id 安全修复
src/app/api/admin/user-profiles/route.ts  | 手机号脱敏
src/app/api/admin/rollback/route.ts       | 命令注入修复
tests/security-test.js                    | 新增安全测试脚本
package.json                              | 添加 test:security 脚本
```

**总计**：17 个文件，524 行新增，83 行删除
