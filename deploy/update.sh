#!/bin/bash
# ============================================================
# 知微阁 · 一键在线升级脚本 v2.0
#
# 工作流程：
#   1. 从 .env 读取授权码和域名
#   2. 请求中央 API 检查更新
#   3. 验证升级权益
#   4. 下载更新包（带 token 鉴权）
#   5. 备份当前版本
#   6. 解压、迁移数据库、重新构建
#   7. 重启 PM2
#   8. 验证服务
#
# 用法：
#   bash deploy/update.sh
#
# 如果没有更新，脚本会安全退出，不做任何改动
# ============================================================

set -e

# ===== 配置 =====
APP_NAME="ming8"
APP_DIR="/www/ming8"
BACKUP_DIR="/www/ming8.bak.$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$APP_DIR/logs/update-$(date +%Y%m%d-%H%M%S).log"
CENTER_API="https://ming8.online"

# ===== 日志函数 =====
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# ===== 检查环境 =====
log "=========================================="
log "知微阁 · 在线升级脚本 v2.0"
log "=========================================="

if [ ! -f "$APP_DIR/.env" ]; then
    log "错误：未找到 .env 配置文件（$APP_DIR/.env）"
    exit 1
fi

# 读取配置
LICENSE_KEY=$(grep '^APP_LICENSE_KEY=' "$APP_DIR/.env" | cut -d'=' -f2- | tr -d '"\r\n')
SITE_URL=$(grep '^NEXTAUTH_URL=' "$APP_DIR/.env" | cut -d'=' -f2- | tr -d '"\r\n')
DOMAIN=$(echo "$SITE_URL" | sed 's|https\?://||' | sed 's|/.*||')

if [ -z "$LICENSE_KEY" ]; then
    log "错误：.env 中未配置 APP_LICENSE_KEY"
    exit 1
fi
if [ -z "$DOMAIN" ]; then
    log "错误：.env 中未配置 NEXTAUTH_URL"
    exit 1
fi

# 获取当前版本
CURRENT_VERSION="v$(grep '"version"' "$APP_DIR/package.json" | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')"
log "当前版本：$CURRENT_VERSION"
log "域名：$DOMAIN"
log ""

# ===== Step 1: 检查更新 =====
log "Step 1/8: 检查更新..."

CHECK_URL="$CENTER_API/api/upgrade/check?license=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$LICENSE_KEY'))")&domain=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$DOMAIN'))")&currentVersion=$CURRENT_VERSION"

RESPONSE=$(curl -s --connect-timeout 10 --max-time 30 "$CHECK_URL")

if [ -z "$RESPONSE" ]; then
    log "错误：无法连接到中央服务器（$CENTER_API）"
    log "请检查网络连接后重试"
    exit 1
fi

# 解析响应（兼容没有 jq 的环境）
HAS_UPDATE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('hasUpdate',''))" 2>/dev/null || echo "")

if [ "$HAS_UPDATE" != "True" ] && [ "$HAS_UPDATE" != "true" ] && [ "$HAS_UPDATE" != "1" ]; then
    REASON=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('reason','无可用更新'))" 2>/dev/null || echo "无可用更新")
    UPGRADE_PLAN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('upgradePlan',''))" 2>/dev/null || echo "")

    log ""
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "❌ 无法升级"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "原因：$REASON"

    if [ "$UPGRADE_PLAN" = "none" ] || echo "$REASON" | grep -q "未激活\|过期\|续费"; then
        log ""
        log "💡 升级服务说明："
        log "   • 源码买断客户享 1 年免费升级"
        log "   • 年度升级服务：¥1,000/年"
        log "   • 单次升级：¥300/次"
        log "   • 联系客服微信：Xcbot2026"
    fi
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

# 提取更新信息
LATEST_VERSION=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('latestVersion',''))" 2>/dev/null || echo "")
DOWNLOAD_URL=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('downloadUrl',''))" 2>/dev/null || echo "")
CHANGELOG=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('changelog',''))" 2>/dev/null || echo "")
REQUIRES_MIGRATION=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('requiresMigration','False'))" 2>/dev/null || echo "False")
FILE_SIZE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('fileSize',0))" 2>/dev/null || echo "0")
UPGRADE_EXPIRY=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('upgradeExpiryAt',''))" 2>/dev/null || echo "")

log "✅ 发现新版本：$LATEST_VERSION"
log "升级权益有效期至：$UPGRADE_EXPIRY"
log ""
log "更新内容："
echo "$CHANGELOG" | while IFS= read -r line; do
    log "  $line"
done
log ""

# 确认升级
read -p "是否执行升级？(y/N): " CONFIRM
[ "$CONFIRM" != "y" ] && log "已取消升级" && exit 0

# ===== Step 2: 下载更新包 =====
log ""
log "Step 2/8: 下载更新包..."

UPDATE_ZIP="$APP_DIR/update-$LATEST_VERSION.zip"
curl -L --connect-timeout 10 --max-time 300 -o "$UPDATE_ZIP" "$DOWNLOAD_URL"

if [ ! -f "$UPDATE_ZIP" ] || [ $(stat -c%s "$UPDATE_ZIP" 2>/dev/null || echo 0) -lt 1000 ]; then
    log "错误：下载失败或文件不完整"
    exit 1
fi

ACTUAL_SIZE=$(stat -c%s "$UPDATE_ZIP")
log "已下载：$(echo "scale=1; $ACTUAL_SIZE/1024/1024" | bc 2>/dev/null || echo "$ACTUAL_SIZE") MB"

# ===== Step 3: 备份当前版本 =====
log ""
log "Step 3/8: 备份当前版本..."
mkdir -p "$BACKUP_DIR"
cp -r "$APP_DIR/src" "$BACKUP_DIR/" 2>/dev/null || true
cp -r "$APP_DIR/public" "$BACKUP_DIR/" 2>/dev/null || true
cp -r "$APP_DIR/deploy" "$BACKUP_DIR/" 2>/dev/null || true
cp -r "$APP_DIR/scripts" "$BACKUP_DIR/" 2>/dev/null || true
cp "$APP_DIR/.env" "$BACKUP_DIR/"
cp "$APP_DIR/package.json" "$BACKUP_DIR/"
cp "$APP_DIR/next.config.js" "$BACKUP_DIR/" 2>/dev/null || true

# 备份数据库
DB_NAME=$(grep '^MYSQL_DATABASE=' "$APP_DIR/.env" | cut -d'=' -f2 | tr -d '"\r\n')
DB_USER=$(grep '^MYSQL_USER=' "$APP_DIR/.env" | cut -d'=' -f2 | tr -d '"\r\n')
DB_PASS=$(grep '^MYSQL_PASSWORD=' "$APP_DIR/.env" | cut -d'=' -f2 | tr -d '"\r\n')

if [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
    log "备份数据库 $DB_NAME..."
    mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/database-backup.sql" 2>/dev/null
    [ $? -eq 0 ] && log "数据库已备份" || log "警告：数据库备份失败，继续升级"
fi

log "已备份到：$BACKUP_DIR"

# ===== Step 4: 保留 .env =====
log ""
log "Step 4/8: 保留配置文件..."
cp "$APP_DIR/.env" /tmp/ming8-env-backup

# ===== Step 5: 解压新版本 =====
log ""
log "Step 5/8: 解压新版本代码..."
cd "$APP_DIR"
unzip -o "$UPDATE_ZIP" -d /tmp/ming8-update-tmp/ > /dev/null 2>&1

UPDATE_SRC=$(find /tmp/ming8-update-tmp -name "package.json" -not -path "*/node_modules/*" | head -1)
UPDATE_DIR=$(dirname "$UPDATE_SRC")
[ -z "$UPDATE_DIR" ] || [ "$UPDATE_DIR" = "." ] && UPDATE_DIR="/tmp/ming8-update-tmp"

cp -r "$UPDATE_DIR/src" "$APP_DIR/"
cp -r "$UPDATE_DIR/public" "$APP_DIR/" 2>/dev/null || true
cp -r "$UPDATE_DIR/deploy" "$APP_DIR/" 2>/dev/null || true
cp -r "$UPDATE_DIR/scripts" "$APP_DIR/" 2>/dev/null || true
cp "$UPDATE_DIR/package.json" "$APP_DIR/"
cp "$UPDATE_DIR/next.config.js" "$APP_DIR/" 2>/dev/null || true
cp /tmp/ming8-env-backup "$APP_DIR/.env"
log "代码已更新"

# ===== Step 6: 数据库迁移 =====
log ""
log "Step 6/8: 检查数据库迁移..."

MIGRATE_FILES=$(find "$APP_DIR/scripts" -name "mysql-migrate-v*.sql" 2>/dev/null | sort -V)
if [ -n "$MIGRATE_FILES" ]; then
    for SQL_FILE in $MIGRATE_FILES; do
        log "执行迁移：$(basename $SQL_FILE)"
        mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE" 2>/dev/null
        [ $? -eq 0 ] && log "  成功" || log "  警告：可能已执行过，跳过"
    done
else
    log "无数据库迁移脚本"
fi

# ===== Step 7: 安装依赖 + 构建 + 重启 =====
log ""
log "Step 7/8: 安装依赖并重新构建..."
cd "$APP_DIR"
npm install --production=false 2>&1 | tail -3

fuser -k 3001/tcp 2>/dev/null || true
npm run build 2>&1 | tail -5

cp -r public .next/standalone/public 2>/dev/null || true
cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
cp deploy/ecosystem.config.js .next/standalone/ 2>/dev/null || true

log "重启 PM2..."
pm2 restart "$APP_NAME" 2>/dev/null || pm2 start deploy/ecosystem.config.js
sleep 5

# ===== Step 8: 验证 =====
log ""
log "Step 8/8: 验证服务状态..."
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    log ""
    log "=========================================="
    log "✅ 升级成功！$CURRENT_VERSION → $LATEST_VERSION"
    log "=========================================="
    log "备份位置：$BACKUP_DIR"
    log ""
    log "如有问题，执行回滚："
    log "  cd /www && mv ming8 ming8.failed && cp -r $BACKUP_DIR ming8 && cd ming8 && pm2 restart $APP_NAME"
    log "=========================================="
else
    log ""
    log "❌ 警告：服务返回 HTTP $HTTP_CODE"
    log "请检查日志：pm2 logs $APP_NAME --lines 50"
    log "如需回滚："
    log "  cd /www && mv ming8 ming8.failed && cp -r $BACKUP_DIR ming8 && cd ming8 && pm2 restart $APP_NAME"
    exit 1
fi

# 清理临时文件
rm -rf /tmp/ming8-update-tmp /tmp/ming8-env-backup "$UPDATE_ZIP"
log ""
log "临时文件已清理"