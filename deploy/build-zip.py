"""构建产物打包脚本 — 排除 .next/cache（946MB 构建缓存，服务器运行不需要）
用法：python deploy/build-zip.py
输出：next-build.zip（约 120MB，原方案 285MB）
"""
import os, zipfile, time

SRC = r'f:\mingliyuanma\.next'
OUT = r'f:\mingliyuanma\next-build.zip'
EXCLUDE_DIRS = {'cache'}  # webpack/混淆缓存，服务器运行不需要

start = time.time()
total = 0
files = 0

def walk():
    for root, dirs, names in os.walk(SRC):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for name in names:
            yield os.path.join(root, name)

print(f'扫描 {SRC} ...')
if os.path.exists(OUT):
    os.remove(OUT)

with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for f in walk():
        arc = os.path.relpath(f, os.path.dirname(SRC))  # 保留 .next/ 顶层目录
        size = os.path.getsize(f)
        total += size
        files += 1
        zf.write(f, arc)

size_mb = os.path.getsize(OUT) / 1024 / 1024
elapsed = time.time() - start
print(f'✅ 打包完成: {size_mb:.0f}MB（{files} 个文件，源 {total/1024/1024:.0f}MB，耗时 {elapsed:.0f}s）')
print(f'   对比: 排除缓存后节省 {(total - size_mb*1024*1024)/1024/1024:.0f}MB')
