"""
增量部署脚本 v8 — 只上传变化的代码，跳过 node_modules
首次部署：完整 zip（25MB）
后续部署：只传 .next 目录（~10MB），上传时间从 3 分钟降到 1 分钟
"""
import os, sys, zipfile, paramiko, time, hashlib, json
from pathlib import Path

# ===== 配置 =====
LOCAL_DIR = Path(__file__).parent.parent
LOCAL_NEXT = LOCAL_DIR / '.next'
LOCAL_STANDALONE = LOCAL_NEXT / 'standalone'
LOCAL_PUBLIC = LOCAL_DIR / 'public'

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'Aa20260618'
REMOTE_DIR = '/www/ming8'

LOCAL_ZIP = LOCAL_DIR / 'deploy' / 'incremental-build.zip'
LOCAL_HASH_FILE = LOCAL_DIR / 'deploy' / '.deploy-hash.json'

def log(msg, level='INFO'):
    ts = time.strftime('%H:%M:%S')
    print(f'[{ts}] {level} {msg}')

# ===== 增量打包 =====
def get_file_hash(filepath: Path) -> str:
    """计算文件 MD5 哈希"""
    h = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

def load_prev_hashes() -> dict:
    """加载上次部署的文件哈希"""
    if LOCAL_HASH_FILE.exists():
        with open(LOCAL_HASH_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_hashes(hashes: dict):
    """保存当前文件哈希"""
    with open(LOCAL_HASH_FILE, 'w') as f:
        json.dump(hashes, f)

def pack_incremental() -> tuple:
    """增量打包：只打包变化的文件"""
    # 同步 .next/static 到 standalone（standalone 不自动包含）
    import shutil
    src_static = LOCAL_DIR / '.next' / 'static'
    dst_static = LOCAL_STANDALONE / '.next' / 'static'
    if src_static.exists():
        if dst_static.exists():
            shutil.rmtree(dst_static)
        shutil.copytree(src_static, dst_static)

    prev_hashes = load_prev_hashes()
    current_hashes = {}
    changed_files = []

    # 收集需要检查的目录
    dirs_to_check = [
        LOCAL_STANDALONE / '.next' / 'static',
        LOCAL_STANDALONE / '.next' / 'server',
        LOCAL_STANDALONE / '.next' / 'required-server-files.json',
        LOCAL_STANDALONE / '.next' / 'prerender-manifest.json',
        LOCAL_STANDALONE / '.next' / 'routes-manifest.json',
        LOCAL_STANDALONE / 'public',
    ]

    for base in dirs_to_check:
        if not base.exists():
            continue
        if base.is_file():
            rel = str(base.relative_to(LOCAL_STANDALONE))
            h = get_file_hash(base)
            current_hashes[rel] = h
            if prev_hashes.get(rel) != h:
                changed_files.append((base, rel))
        else:
            for root, dirs, files in os.walk(base):
                for file in files:
                    fp = Path(root) / file
                    rel = str(fp.relative_to(LOCAL_STANDALONE))
                    try:
                        h = get_file_hash(fp)
                    except:
                        continue
                    current_hashes[rel] = h
                    if prev_hashes.get(rel) != h:
                        changed_files.append((fp, rel))

    if not changed_files:
        log('没有文件变化，无需部署')
        return 0, 0

    log(f'检测到 {len(changed_files)} 个文件变化')

    # 打包变化的文件
    LOCAL_ZIP.unlink(missing_ok=True)
    with zipfile.ZipFile(LOCAL_ZIP, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for fp, rel in changed_files:
            arcname = rel.replace('\\', '/')
            zf.write(fp, arcname)

    zip_size = LOCAL_ZIP.stat().st_size
    save_hashes(current_hashes)
    return len(changed_files), zip_size

# ===== 首次完整打包 =====
def pack_full() -> int:
    """完整打包 standalone 目录"""
    # Next.js standalone 不自动复制 .next/static 和 public，需要手动复制
    import shutil
    src_static = LOCAL_DIR / '.next' / 'static'
    dst_static = LOCAL_STANDALONE / '.next' / 'static'
    if src_static.exists():
        if dst_static.exists():
            shutil.rmtree(dst_static)
        shutil.copytree(src_static, dst_static)
        log('  已复制 .next/static 到 standalone')

    src_public = LOCAL_DIR / 'public'
    dst_public = LOCAL_STANDALONE / 'public'
    if src_public.exists() and not dst_public.exists():
        shutil.copytree(src_public, dst_public)
        log('  已复制 public 到 standalone')

    LOCAL_ZIP.unlink(missing_ok=True)
    with zipfile.ZipFile(LOCAL_ZIP, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for root, dirs, files in os.walk(LOCAL_STANDALONE):
            # 跳过 cache 目录
            dirs[:] = [d for d in dirs if d != 'cache']
            for file in files:
                full_path = Path(root) / file
                arcname = str(full_path.relative_to(LOCAL_STANDALONE)).replace('\\', '/')
                zf.write(full_path, arcname)

    # 保存所有文件哈希
    hashes = {}
    for root, dirs, files in os.walk(LOCAL_STANDALONE):
        dirs[:] = [d for d in dirs if d != 'cache']
        for file in files:
            fp = Path(root) / file
            rel = str(fp.relative_to(LOCAL_STANDALONE)).replace('\\', '/')
            try:
                hashes[rel] = get_file_hash(fp)
            except:
                pass
    save_hashes(hashes)
    return LOCAL_ZIP.stat().st_size

# ===== 部署 =====
def deploy(zip_size: int, is_full: bool):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

    def run(cmd):
        _, stdout, stderr = ssh.exec_command(cmd, get_pty=True)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        return out, err

    # 上传
    log(f'上传增量包 ({zip_size / 1024 / 1024:.1f} MB)...')
    sftp = ssh.open_sftp()
    start = time.time()

    def progress(transferred, total):
        if total == 0:
            return
        pct = transferred / total * 100
        elapsed_t = time.time() - start
        if elapsed_t > 0 and int(pct) % 10 == 0:
            speed = transferred / elapsed_t / 1024
            log(f'  上传中: {pct:.0f}% ({transferred / 1024 / 1024:.1f}/{total / 1024 / 1024:.1f} MB, {speed:.0f} KB/s)')

    with open(LOCAL_ZIP, 'rb') as f:
        sftp.putfo(f, f'{REMOTE_DIR}/incremental-build.zip', callback=progress)
    elapsed = time.time() - start
    log(f'✓ 上传完成: {elapsed:.0f}s ({zip_size / 1024 / elapsed:.0f} KB/s)')

    # 服务器解压（直接解压到 /www/ming8，因为 PM2 使用 next start 读取该目录）
    log('服务器解压...')
    if is_full:
        run(f'cd {REMOTE_DIR} && mv .next .next.bak 2>/dev/null; rm -rf .next')
        run(f'cd {REMOTE_DIR} && rm -rf .next/static/chunks .next/server && unzip -qo {REMOTE_DIR}/incremental-build.zip && rm -f {REMOTE_DIR}/incremental-build.zip')
    else:
        # 增量部署也清理 chunks 目录，确保旧 JS 不残留
        run(f'cd {REMOTE_DIR} && rm -rf .next/static/chunks && unzip -qo {REMOTE_DIR}/incremental-build.zip && rm -f {REMOTE_DIR}/incremental-build.zip')

    # 重启 PM2
    log('重启 PM2...')
    run('su - admin -c "pm2 restart ming8" 2>&1')
    time.sleep(8)

    # 验证
    out, _ = run('curl -s -o /dev/null -w "%{http_code}" --max-time 15 http://localhost:3001')
    log(f'首页: HTTP {out}')
    if out == '200':
        log('✓ 部署成功！')
    else:
        log('✗ 部署失败，检查日志', 'ERROR')
        out, _ = run('su - admin -c "pm2 logs ming8 --lines 5 --nostream --err" 2>&1')
        print(out)

    ssh.close()
    return out == '200'

def main():
    log('=' * 60)
    log('V8 增量部署')
    log('=' * 60)

    # 检查 standalone 是否存在
    if not LOCAL_STANDALONE.exists():
        log('standalone 目录不存在，请先运行 npm run build', 'ERROR')
        return

    # 判断是首次还是增量
    is_full = not LOCAL_HASH_FILE.exists()

    if is_full:
        log('首次部署，完整打包...')
        zip_size = pack_full()
        log(f'✓ 完整包: {zip_size / 1024 / 1024:.1f} MB')
    else:
        log('增量打包...')
        changed, zip_size = pack_incremental()
        if changed == 0:
            log('没有文件变化，跳过部署')
            return
        log(f'✓ 增量包: {zip_size / 1024 / 1024:.1f} MB ({changed} 个文件)')

    deploy(zip_size, is_full)

if __name__ == '__main__':
    main()
