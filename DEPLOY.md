# 知微阁部署到 Cloudflare Pages 完整指南

> **TL;DR**：在项目根目录运行 `.\deploy-cf.ps1` 即可一键完成全部首次部署。

## 快速开始（推荐：一键部署）

### 方式 A：本地一键脚本（首次部署）

在 PowerShell 中执行：

```powershell
.\deploy-cf.ps1
```

脚本会自动完成：

1. 检查并安装 Node.js / npm / wrangler
2. 触发 wrangler 登录（首次会弹浏览器授权）
3. 检测 `wrangler.toml` 中的占位符，自动创建 D1 数据库和 KV 命名空间，回填真实 ID
4. 提示输入 `NEXTAUTH_URL`（默认用 `https://mingli-yuanma.pages.dev`）
5. 生成 `prisma/migrations.sql` 并推送到远程 D1
6. 创建 Pages 项目，设置 `NEXTAUTH_SECRET` 密钥
7. 构建 + 部署

**常用参数：**

```powershell
# 只构建不部署，验证 CF 兼容性
.\deploy-cf.ps1 -SkipDeploy

# 已构建过，只重新推送部署
.\deploy-cf.ps1 -SkipBuild

# 指定 Pages 项目名
.\deploy-cf.ps1 -ProjectName my-mingli
```

后续代码更新，再次跑 `.\deploy-cf.ps1` 就完成重建+部署。

---

### 方式 B：GitHub Actions 自动部署（首次手动跑过方式 A 后启用）

把代码推送到 GitHub main 分支即可自动部署。需要在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中配置：

**Required Secrets：**

| Secret 名 | 说明 | 获取方式 |
|----------|------|----------|
| `CLOUDFLARE_API_TOKEN` | CF API 令牌 | Dashboard → My Profile → API Tokens → Create Token，选 "Edit Cloudflare Workers" 模板，再加 `Cloudflare Pages:Edit` 权限 |
| `CLOUDFLARE_ACCOUNT_ID` | CF 账号 ID | Dashboard 右下角可看到 |
| `NEXTAUTH_SECRET` | NextAuth 密钥 | 用 `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` 生成 |

**Required Variables（可选，建议设置）：**

| Variable 名 | 说明 |
|------------|------|
| `NEXTAUTH_URL` | 站点完整 URL，如 `https://mingli.example.com` |

> 注意：首次必须先用方式 A 在本地跑一次，把 D1/KV 的真实 ID 写入 `wrangler.toml` 并提交到仓库；GitHub Actions 直接读 `wrangler.toml`，不会再创建资源。Workflow 文件位于 [.github/workflows/deploy-cf.yml](file:///f:/mingliyuanma/.github/workflows/deploy-cf.yml)。

---

## 方式 C：在 Cloudflare Dashboard 连接 Git（半自动）

如果不想用 GitHub Actions，可以让 CF 直接连接 GitHub 仓库：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. 选择你的 GitHub 仓库
4. 配置：
   - **Framework preset**: Next.js
   - **Build command**: `npm run build:pages`
   - **Build output directory**: `.vercel/output/static`
   - **Environment variables**: `NEXTAUTH_URL`、`NEXTAUTH_SECRET`、`CF_PAGES=1`
5. 点击 **Save and Deploy**

> D1/KV 绑定仍需在 Dashboard → Settings → Functions 中手动配置（参见下方"手动流程参考"第 9 步）。

---

## 绑定自定义域名（所有方式通用）

1. Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入你的域名（如 `mingli.example.com`）
3. 按提示在域名 DNS 添加 CNAME 记录
4. Cloudflare 自动配置 HTTPS 证书
5. 更新 `wrangler.toml` 或 GitHub Variable `NEXTAUTH_URL` 为该域名，重新部署

---

## 手动流程参考（10 步详解）

### 前置条件

- 注册 [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
- 安装 Node.js 18+
- 项目代码已推送到 GitHub 仓库

### 第1步：安装 Cloudflare CLI 并登录

```bash
npm install -g wrangler
wrangler login
```

浏览器会弹出 Cloudflare 授权页面，点击允许。

### 第2步：创建 D1 数据库

```bash
wrangler d1 create mingli-db
```

输出示例：
```
✅ Successfully created DB 'mingli-db'
[[d1_databases]]
binding = "DB"
database_name = "mingli-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  ← 复制这个 ID
```

将 `database_id` 填入项目根目录的 `wrangler.toml` 文件中。

### 第3步：创建 KV 命名空间（用于会话缓存）

```bash
wrangler kv namespace create SESSIONS
```

输出示例：
```
[[kv_namespaces]]
binding = "SESSIONS"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  ← 复制这个 ID
```

将 `id` 填入 `wrangler.toml` 文件中。

### 第4步：生成数据库迁移 SQL 并推送到 D1

```bash
# 生成迁移 SQL
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --output prisma/migrations.sql --script

# 本地预览执行
npm run db:migrate:d1:local

# 推送到云端 D1
npm run db:migrate:d1
```

### 第5步：设置敏感环境变量

不要在 wrangler.toml 中写密钥！用 wrangler secret 设置：

```bash
wrangler pages secret put NEXTAUTH_SECRET --project-name mingli-yuanma
# 输入随机密钥（用 openssl rand -base64 32 生成）
```

### 第6步：本地预览测试（可选但推荐）

```bash
npm install @cloudflare/next-on-pages @prisma/adapter-d1
npm run build:pages
npm run preview:pages
```

打开 http://localhost:8788 验证功能是否正常。

### 第7步：推送到 GitHub

```bash
git add .
git commit -m "feat: add Cloudflare Pages deployment support"
git push origin main
```

### 第8步：在 Cloudflare Dashboard 连接仓库（或使用方式 C）

详见上方"方式 C"。

### 第9步：绑定 D1 数据库和 KV

部署成功后，在 Pages 项目设置中绑定资源：

1. 进入 Pages 项目 → **Settings** → **Functions**
2. **D1 database bindings**:
   - Variable name: `DB`
   - D1 database: `mingli-db`
3. **KV namespace bindings**:
   - Variable name: `SESSIONS`
   - KV namespace: `SESSIONS`
4. 重新部署一次使绑定生效

### 第10步：绑定自定义域名

见上方"绑定自定义域名"章节。

---

## 常见问题排查

### Q: 构建报错 "Cannot find module '@cloudflare/next-on-pages'"
A: 确保已安装：`npm install --save-dev @cloudflare/next-on-pages`

### Q: API 报错 "D1 binding not found"
A: 检查 wrangler.toml 中的 database_id 是否正确，且在 Dashboard 中绑定了 D1。

### Q: 登录失败 "NEXTAUTH_SECRET is not set"
A: 在 Dashboard → Settings → Environment variables 中添加 NEXTAUTH_SECRET。

### Q: bcryptjs 在 Edge Runtime 报错
A: bcryptjs 是纯 JS 实现，应该兼容。如遇问题可改用 `bcrypt-edge` 或 `@node-rs/bcrypt`。

### Q: 数据库连接失败
A: D1 不需要连接字符串，通过 binding 访问。确保代码中用 D1 adapter 而非 DATABASE_URL。

---

## 文件改动清单

本次部署支持涉及的文件改动：

| 文件 | 改动说明 |
|------|----------|
| `prisma/schema.prisma` | 添加 `previewFeatures = ["driverAdapters"]` |
| `src/lib/db/prisma.ts` | 适配 D1 adapter，本地开发保持不变 |
| `wrangler.toml` | 新建，CF 配置文件 |
| `package.json` | 添加 build:pages / deploy:pages / db:migrate:d1 脚本 |
| `next.config.js` | CF 构建时用默认 distDir |
| `DEPLOY.md` | 本文档 |

---

## 本地开发不受影响

所有改动都通过环境变量 `CF_PAGES` 区分：
- 本地 `npm run dev` → 用 SQLite + DATABASE_URL，和以前完全一样
- CF 部署 `npm run build:pages` → 用 D1 adapter + binding
