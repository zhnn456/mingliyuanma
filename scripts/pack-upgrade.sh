#!/bin/bash
# 升级包打包脚本
# 用法: bash scripts/pack-upgrade.sh [版本号]
# 示例: bash scripts/pack-upgrade.sh v4.1.0
#
# 打包 .next 目录为 tar.gz，计算 SHA256，输出升级信息

set -e

# 获取版本号
VERSION=${1:-v$(node -p "require('./package.json').version")}
OUTPUT_DIR="./upgrade-packages"
ARCHIVE="$OUTPUT_DIR/update-$VERSION.tar.gz"

echo "=========================================="
echo "  打包升级包: $VERSION"
echo "=========================================="

# 1. 构建
echo ""
echo "[1/4] 构建 Next.js..."
npm run build

# 2. 打包 .next（排除缓存目录）
echo ""
echo "[2/4] 打包 .next..."
mkdir -p "$OUTPUT_DIR"
tar -czf "$ARCHIVE" \
  --exclude='.next/cache' \
  --exclude='.next/esm-cache' \
  --exclude='.next/trace' \
  .next

# 3. 计算 SHA256
echo ""
echo "[3/4] 计算 SHA256..."
CHECKSUM=$(sha256sum "$ARCHIVE" | cut -d' ' -f1)
FILESIZE=$(stat -c%s "$ARCHIVE" 2>/dev/null || stat -f%z "$ARCHIVE")

# 4. 输出信息
echo ""
echo "[4/4] 完成!"
echo ""
echo "=========================================="
echo "  升级包信息"
echo "=========================================="
echo "  版本:     $VERSION"
echo "  文件:     $ARCHIVE"
echo "  大小:     $((FILESIZE / 1024 / 1024)) MB ($FILESIZE bytes)"
echo "  SHA256:   $CHECKSUM"
echo ""
echo "请上传到中央站管理后台，填写以下信息:"
echo "  version:  $VERSION"
echo "  filePath: /www/ming8-data/upgrades/update-$VERSION.tar.gz"
echo "  checksum: $CHECKSUM"
echo "  fileSize: $FILESIZE"
echo "=========================================="
