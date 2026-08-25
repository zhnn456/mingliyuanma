# 知微阁部署指南

> 生产环境：新中央站 47.79.237.103 · PM2 + MySQL · https://ming8.online

## 快速部署（一键）

在项目根目录执行：

```powershell
# 0. 设置服务器登录凭据（二选一，不写进代码）
$env:DEPLOY_SSH_PASSWORD = '<root密码>'        # 或 $env:DEPLOY_SSH_KEY = 'C:\path\to\id_rsa'

# 1. 本地构建（必须，部署前会校验本地 BUILD_ID）
npm run build:server

# 2. 部署（必须显式指定目标，不带 --target 会直接报错）
python scripts/deploy.py --target ming8       # 中央站 ming8.online
python scripts/deploy.py --target source      # 源码站 bazi6.cc.cd
python scripts/deploy.py --target test-source # 测试SaaS站

# 3. 源码站部署后验证（可选，只读检查：版本比对/静态资源/登录链路）
python scripts/verify-bazi6.py
```

`deploy.py` 会自动完成：
1. 打包本地 `.next` 与 `server.js`（仅排除 `.next/cache`、`.next/standalone`）
2. SSH 上传到服务器 `/tmp/deploy-next.tar.gz`
3. 备份旧 `.next` 和 `server.js` 到 `/www/ming8-backup-{时间戳}`
4. 解压覆盖 `.next/static`、`.next/server`、`.next/BUILD_ID`、`routes-manifest.json`、`server.js`
5. PM2 重启 + BUILD_ID 一致性强校验（不一致即中止）+ 线上健康检查

## 服务器环境

### 中央站（ming8.online）

| 项 | 值 |
|---|---|
| 服务器 | 47.79.237.103 |
| 应用目录 | `/www/ming8` |
| PM2 进程 | `ming8`（`next start -p 3001`）|
| 数据库 | MySQL `ming8_db`（用户 `ming8`）|
| 反向代理 | Nginx（80/443 → 3001）|
| 域名 | https://ming8.online |
| 角色 | IS_CENTER=true（中央平台模式）|

### 源码站（bazi6.cc.cd）

| 项 | 值 |
|---|---|
| 服务器 | 47.79.3.189 |
| 应用目录 | `/www/ming8` |
| PM2 进程 | `ming8` |
| 数据库 | MySQL `ming8_db`（独立） |
| 角色 | 源码代理站点（需 APP_LICENSE_KEY） |

### 测试 SaaS 站

| 项 | 值 |
|---|---|
| 服务器 | 47.79.237.103（与中央站同机） |
| 应用目录 | `/www/test-source` |
| PM2 进程 | `test-source` |
| 数据库 | MySQL `test_source_db`（独立） |
| 端口 | 3002 |
| 域名 | https://test-source.ming8.online |

## 数据库

```bash
# 初始化/迁移（幂等，每次部署自动执行）
mysql -u ming8 -p ming8_db < scripts/mysql-init.sql

# 合规改造专用
mysql -u ming8 -p ming8_db < scripts/update_supplies_compliance.sql
```

## 部署目标对照

| 服务器 | IP | 部署命令 |
|--------|-----|---------|
| 中央站 ming8.online | 47.79.237.103 | `python scripts\deploy.py --target ming8` |
| 源码站 bazi6.cc.cd | 47.79.3.189 | `python scripts\deploy.py --target source` |
| 测试SaaS站 | 47.79.237.103 | `python scripts\deploy.py --target test-source` |

## 环境变量

`.env` 配置（部署时通过脚本写入服务器）：

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=ming8
MYSQL_PASSWORD=***
MYSQL_DATABASE=ming8_db
NEXTAUTH_URL=https://ming8.online
NEXTAUTH_SECRET=***
IS_CENTER=true
```

> 密钥类配置（Stripe、PayPal 等）不要在代码中硬编码，通过环境变量注入。

## 常见问题

### Q: 页面 502
A: PM2 进程未启动。执行 `pm2 list` 查看，若为空则 `cd /www/ming8 && pm2 start ecosystem.config.js`。

### Q: 页面 500
A: `pm2 logs ming8 --lines 50` 查看日志；确认数据库连接（`.env` 中 MYSQL_* 配置）。

### Q: chunk 404
A: `.next/static` 缺失或构建不完整。重新 `npm run build:server` 并部署。
