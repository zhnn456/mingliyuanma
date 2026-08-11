"""构建产物打包脚本 — 排除 .next/cache，包含 public 静态资源
用法：python deploy/build-zip.py
输出：next-build.zip（约 30MB，含 .next/ 与 public/）
说明：public 打进包后，部署不再依赖 git pull 同步静态文件（仓库转私有也不受影响）
"""
import os, zipfile, time

SRC_DIRS = [r'f:\mingliyuanma\.next', r'f:\mingliyuanma\public']
OUT = r'f:\mingliyuanma\next-build.zip'
EXCLUDE_DIRS = {'cache'}  # webpack/混淆缓存，服务器运行不需要

start = time.time()
total = 0
files = 0

def walk(root):
    for dirpath, dirs, names in os.walk(root):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for name in names:
            yield os.path.join(dirpath, name)

print(f'扫描 {SRC_DIRS} ...')
if os.path.exists(OUT):
    os.remove(OUT)

with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for src in SRC_DIRS:
        base = os.path.dirname(src)  # 保留顶层目录名（.next/ public/）
        for f in walk(src):
            arc = os.path.relpath(f, base)
            size = os.path.getsize(f)
            total += size
            files += 1
            zf.write(f, arc)

size_mb = os.path.getsize(OUT) / 1024 / 1024
elapsed = time.time() - start
print(f'✅ 打包完成: {size_mb:.0f}MB（{files} 个文件，源 {total/1024/1024:.0f}MB，耗时 {elapsed:.0f}s）')
