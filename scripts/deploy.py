"""打包并部署到指定服务器"""
import paramiko, os, sys, time
sys.stdout.reconfigure(encoding='utf-8')

# 服务器配置：中央站 / 源码站
SERVERS = {
    'ming8': {  # 中央站
        'host': '47.79.237.103',
        'pass': 'Aa20260618',
        'pm2': 'ming8',
    },
    'test-source': {  # 测试SaaS站
        'host': '47.79.237.103',
        'pass': 'Aa20260618',
        'pm2': 'test-source',
    },
    'source': {  # 源码站 bazi6.cc.cd
        'host': '47.79.3.189',
        'pass': 'Aa20260618',
        'pm2': 'ming8',
    },
}

# 默认部署到ming8，可通过 --target test-source / source 指定
target = 'ming8'
if '--target' in sys.argv:
    idx = sys.argv.index('--target')
    if idx + 1 < len(sys.argv):
        target = sys.argv[idx + 1]

if target not in SERVERS:
    print(f'未知目标: {target}，可选: {", ".join(SERVERS.keys())}')
    sys.exit(1)

HOST = SERVERS[target]['host']
USER = 'root'
PASS = SERVERS[target]['pass']
LOCAL_DIR = r'f:\mingliyuanma'
# 各目标远程应用目录必须与 PM2 实际 cwd 一致（源码站与中央站同为 /www/ming8）
REMOTE_DIRS = {
    'ming8': '/www/ming8',
    'test-source': '/www/test-source',
    'source': '/www/ming8',
}
REMOTE_DIR = REMOTE_DIRS[target]

print(f'=== 部署到 {target} ({REMOTE_DIR}) ===')
print('=== 1. 打包 .next ===')
import tarfile
archive_path = os.path.join(LOCAL_DIR, 'deploy-next.tar.gz')
with tarfile.open(archive_path, 'w:gz') as tar:
    next_dir = os.path.join(LOCAL_DIR, '.next')
    tar.add(next_dir, arcname='.next', filter=lambda info: None if ('cache' in info.name or 'standalone' in info.name) else info)
size = os.path.getsize(archive_path)
print(f'  打包完成: {size // 1024 // 1024} MB')

print('\n=== 2. 上传 ===')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, look_for_keys=False, allow_agent=False, timeout=30)
sftp = ssh.open_sftp()

# 部署前置校验：远端应用目录必须存在且为有效 Next.js 应用（杜绝路径映射错误导致的假部署）
_stdin, _stdout, _stderr = ssh.exec_command(f'ls {REMOTE_DIR}/.next/BUILD_ID 2>/dev/null', timeout=20)
_check = _stdout.read().decode('utf-8', errors='replace').strip()
if not _check:
    ssh.close()
    raise SystemExit(
        f'部署中止：远端 {HOST}:{REMOTE_DIR} 不是有效的应用目录（缺少 .next/BUILD_ID）。'
        f'请核对 REMOTE_DIRS 映射与服务器实际 PM2 cwd！'
    )
print(f'  前置校验通过: {REMOTE_DIR} 存在有效构建')

remote_archive = '/tmp/deploy-next.tar.gz'
sftp.put(archive_path, remote_archive)
print('  上传完成')

print('\n=== 3. 备份并解压 ===')
def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if exit_code != 0:
        print(f'  [失败 exit={exit_code}] {cmd}')
        if err:
            print(f'    {err[:400]}')
        raise SystemExit(f'部署中止：远程命令执行失败 → {cmd}')
    return out

# 备份
backup_dir = '%s-backup-%d' % (REMOTE_DIR, int(time.time()))
run('cp -r %s/.next %s' % (REMOTE_DIR, backup_dir))
print('  备份: %s' % backup_dir)

# 解压覆盖
run('cd /tmp && tar -xzf deploy-next.tar.gz')
run('rm -rf %s/.next/static %s/.next/server' % (REMOTE_DIR, REMOTE_DIR))
run('cp -r /tmp/.next/static %s/.next/static' % REMOTE_DIR)
run('cp -r /tmp/.next/server %s/.next/server' % REMOTE_DIR)
run('cp /tmp/.next/BUILD_ID %s/.next/BUILD_ID' % REMOTE_DIR)
# 路由清单必须同步：next.config 的 headers()/redirects()/rewrites() 全部编译在 routes-manifest.json 中
run('cp /tmp/.next/routes-manifest.json %s/.next/routes-manifest.json 2>/dev/null; echo OK' % REMOTE_DIR)
# 页面→chunk 映射清单必须同步：app-build-manifest/build-manifest 过期会导致 SSR HTML 引用已不存在的
# _next/static chunk（404），浏览器端 JS 无法水合，表现为"页面能打开但按钮全部无反应"
for extra in ('prerender-manifest.json', 'app-build-manifest.json', 'build-manifest.json',
              'react-loadable-manifest.json', 'app-path-routes-manifest.json',
              'required-server-files.json', 'packagePath.txt'):
    run('cp /tmp/.next/%s %s/.next/%s 2>/dev/null; echo OK' % (extra, REMOTE_DIR, extra))
print('  解压覆盖完成')

print('\n=== 4. 重启 PM2 ===')
pm2_name = SERVERS[target]['pm2']
run(f'pm2 restart {pm2_name} --update-env')
time.sleep(3)
out = run(f'pm2 status {pm2_name}')
print('  PM2 状态:')
for line in out.split('\n'):
    if pm2_name in line or 'status' in line.lower():
        print('    %s' % line)

print('\n=== 5. 构建一致性校验（防假部署） ===')
local_build_id = ''
_bid = os.path.join(LOCAL_DIR, '.next', 'BUILD_ID')
if os.path.exists(_bid):
    local_build_id = open(_bid, encoding='utf-8').read().strip()
remote_build_id = run('cat %s/.next/BUILD_ID' % REMOTE_DIR).strip()
print(f'  本地 BUILD_ID: {local_build_id}')
print(f'  远端 BUILD_ID: {remote_build_id}')
if local_build_id and remote_build_id != local_build_id:
    raise SystemExit('部署中止：远端 BUILD_ID 与本地构建不一致，本次部署未真正生效！请检查 REMOTE_DIRS 映射。')
print('  ✅ BUILD_ID 一致，代码已真实落盘')

# 清理旧备份（保留最近5个）
old_backups = run('ls -dt %s-backup-* 2>/dev/null | tail -n +6' % REMOTE_DIR)
for b in old_backups.split('\n'):
    b = b.strip()
    if b:
        run('rm -rf %s' % b)
        print(f'  清理旧备份: {b}')

# nginx 限流防护检测（-R 跟随 sites-enabled 目录下的符号链接）
nginx_hit = run('grep -Rl "limit_req" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | head -1 || true')
if not nginx_hit.strip():
    print('  ⚠️ 服务器 nginx 未配置 limit_req 限流！请参照 deploy/nginx-ming8.conf 加固模板配置后 reload')

print('\n=== 6. 线上验证 ===')
import requests
time.sleep(2)
domains = {
    'ming8': 'ming8.online',
    'test-source': 'test-source.ming8.online',
    'source': 'bazi6.cc.cd',
}
domain = domains.get(target, 'ming8.online')

def http_status(path):
    try:
        return requests.get(f'https://{domain}{path}', timeout=10).status_code
    except Exception as e:
        return str(e)

home_status = http_status('/')
health_status = http_status('/api/health')
stats_status = http_status('/api/admin/stats')
print(f'  首页: {home_status}')
print(f'  /api/health: {health_status}')
print(f'  匿名管理接口(应为403): {stats_status}')
if home_status != 200 or stats_status != 403:
    print('  ⚠️ 验证指标异常，请立即人工复核！')

sftp.close()
ssh.close()

# 清理本地文件
os.remove(archive_path)

print('\n=== 部署完成 ===')
print(f'备份位置: {backup_dir}')
