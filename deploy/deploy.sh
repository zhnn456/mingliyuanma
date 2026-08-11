#!/bin/bash
# 知微阁站部署脚本
# 用法：在服务器上执行 bash deploy.sh

set -e

APP_DIR="/www/ming8"
REPO_DIR="/www/ming8/repo"

echo "===== 知微阁站部署 ====="

# 1. 创建目录
mkdir -p $APP_DIR/logs

# 2. 安装依赖
cd $REPO_DIR
npm install --production=false

# 3. 构建
npm run build

# 4. 初始化数据库（首次执行）
if [ ! -f "$APP_DIR/.db-initialized" ]; then
  echo "首次运行，初始化数据库..."
  mysql -u ming8 -p'Ming8@2026!' ming8_db < scripts/mysql-init.sql
  touch "$APP_DIR/.db-initialized"
fi

# 5. 复制环境变量
cp .env.production $APP_DIR/.env

# 6. 复制构建产物
cp -r .next $APP_DIR/
cp -r public $APP_DIR/
cp -r node_modules $APP_DIR/
cp package.json next.config.js $APP_DIR/

# 7. 重启 PM2
pm2 reload $APP_DIR/ecosystem.config.js
pm2 save

echo "===== 部署完成 ====="
echo "访问: http://ming8.online"
