#!/bin/bash
# 知微阁站一键部署脚本
# 用法：cd /www/ming8 && git pull && bash deploy/auto-deploy.sh
set -e

echo "===== 1/6 停止 ming8 进程释放内存 ====="
pm2 stop ming8 2>/dev/null || true

echo "===== 2/6 初始化数据库（含 DivinationRule 新表）====="
mysql -u ming8 -p'Ming8@2026!' ming8_db < scripts/mysql-init.sql 2>&1 | grep -v "Using a password" || true

echo "===== 3/6 确保 swap 存在 ====="
if ! swapon --show | grep -q swap; then
  echo "创建 2G swap..."
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
else
  echo "swap 已存在，跳过"
fi

echo "===== 4/6 清理旧构建 ====="
rm -rf .next

echo "===== 5/6 构建（限制内存避免 OOM）====="
NODE_OPTIONS="--max-old-space-size=1024" npm run build

echo "===== 6/6 启动服务 ====="
pm2 start ming8 || pm2 restart ming8
pm2 save

echo "===== 验证 ====="
sleep 3
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$RESPONSE" = "200" ]; then
  echo "✅ 部署成功！网站已在 http://localhost:3001 运行"
else
  echo "⚠️ HTTP 状态码: $RESPONSE，查看日志：pm2 logs ming8 --lines 30"
fi
echo ""
echo "===== 内存情况 ====="
free -h
