# 知微阁部署指南（香港服务器）

> 生产环境：香港服务器（47.82.116.220）· PM2 + MySQL · https://ming8.online

## 快速部署（一键）

在项目根目录执行：

```powershell
# 1. 本地构建（version-inject + 生成知识库 + next build）
npm run build:server

# 2. 打包构建产物（自动排除 .next/cache，仅 ~30MB）
python deploy/build-zip.py

# 3. 部署到服务器（SSH 上传 + 解压 + PM2 重启）
python deploy/remote-deploy.py
```

`remote-deploy.py` 会自动完成：
1. 停止 ming8 进程
2. 服务器上 `git pull` 拉取最新代码
3. 执行 `scripts/mysql-init.sql`（幂等，不会重复插入）
4. 上传 `next-build.zip` 并解压替换 `.next`
5. PM2 启动 + 健康检查（HTTP 200）

## 服务器环境

| 项 | 值 |
|---|---|
| 服务器 | 47.82.116.220（香港，1.6G 内存 + 2G swap）|
| 应用目录 | `/www/ming8` |
| PM2 进程 | `ming8`（`next start -p 3001`）|
| 数据库 | MySQL `ming8_db`（用户 `ming8`）|
| 反向代理 | Nginx（80/443 → 3001）|
| 域名 | https://ming8.online |

## 数据库

```bash
# 初始化/迁移（幂等，每次部署自动执行）
mysql -u ming8 -p ming8_db < scripts/mysql-init.sql

# 合规改造专用（供品去宗教化等存量数据更新）
mysql -u ming8 -p ming8_db < scripts/update_supplies_compliance.sql
```

## 服务器内存受限说明

服务器内存仅 1.6G，**不要在服务器上执行 `next build`**（会 OOM）。
标准流程是本地构建 → 上传产物。打包脚本 `deploy/build-zip.py` 已排除
`.next/cache`（约 950MB 构建缓存），将上传体积从 285MB 降到约 30MB。

## 常见问题

### Q: 上传慢 / 文件大
A: 确认用的是 `python deploy/build-zip.py` 打包（排除缓存），而非直接压缩 `.next` 整个目录。

### Q: git pull 报 "insufficient permission"
A: 执行 `chown -R admin:admin /www/ming8/.git` 修复仓库权限。

### Q: 页面 500
A: `pm2 logs ming8 --lines 50` 查看日志；确认数据库连接（.env.production 中 MYSQL_* 配置）。

## 环境变量

`.env.production` 配置（部署时复制到服务器）：

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=ming8
MYSQL_PASSWORD=***
MYSQL_DATABASE=ming8_db
NEXTAUTH_URL=https://ming8.online
NEXTAUTH_SECRET=***
PORT=3001
```

> 密钥类配置（Stripe 等）不要在代码中硬编码，通过环境变量注入。
