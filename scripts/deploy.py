"""打包并部署到指定服务器（凭据通过环境变量注入，禁止硬编码）"""
import os
import sys
import time
import tarfile
import urllib.error
import urllib.request

import paramiko

sys.stdout.reconfigure(encoding='utf-8')

SERVERS = {
    'ming8': {  # 中央站
        'host': '47.79.237.103',
        'pm2': 'ming8',
    },
    'test-source': {  # 测试SaaS站
        'host': '47.79.237.103',
        'pm2': 'test-source',
    },
    'source': {  # 源码站 bazi6.cc.cd
        'host': '47.79.3.189',
        'pm2': 'ming8',
    },
}
DOMAINS = {
    'ming8': 'ming8.online',
    'test-source': 'test-source.ming8.online',
    'source': 'bazi6.cc.cd',
}
REMOTE_DIRS = {
    'ming8': '/www/ming8',
    'test-source': '/www/test-source',
    'source': '/www/ming8',
}

target = None
if '--target' in sys.argv:
    idx = sys.argv.index('--target')
    if idx + 1 < len(sys.argv):
        target = sys.argv[idx + 1]

if target not in SERVERS:
    print(f'未知或缺失目标: {target}')
    print('用法: python scripts/deploy.py --target <ming8|test-source|source>')
    sys.exit(1)

HOST = SERVERS[target]['host']
PM2_NAME = SERVERS[target]['pm2']
REMOTE_DIR = REMOTE_DIRS[target]
LOCAL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

LOCAL_BUILD_ID_PATH = os.path.join(LOCAL_DIR, '.next', 'BUILD_ID')
if not os.path.exists(LOCAL_BUILD_ID_PATH):
    raise SystemExit('部署中止：本地缺少 .next/BUILD_ID，请先执行 npm run build:server 完成构建再部署！')
LOCAL_BUILD_ID = open(LOCAL_BUILD_ID_PATH, encoding='utf-8').read().strip()

print(f'=== 部署到 {target} ({HOST}:{REMOTE_DIR}) ===')
print(f'本地 BUILD_ID: {LOCAL_BUILD_ID}')


def connect_ssh(host):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    password = os.environ.get('DEPLOY_SSH_PASSWORD')
    key_path = os.environ.get('DEPLOY_SSH_KEY')
    kwargs = dict(hostname=host, username='root', look_for_keys=False, allow_agent=False, timeout=30)
    if key_path:
        kwargs['key_filename'] = key_path
    elif password:
        kwargs['password'] = password
    else:
        raise SystemExit('部署中止：缺少登录凭据。请先设置环境变量 DEPLOY_SSH_PASSWORD（root 密码）或 DEPLOY_SSH_KEY（私钥路径）')
    ssh.connect(**kwargs)
    return ssh


def exclude_filter(info):
    name = info.name.replace('\\', '/')
    if name == '.next/cache' or name.startswith('.next/cache/') \
            or name == '.next/standalone' or name.startswith('.next/standalone/'):
        return None
    return info


print('\n=== 1. 打包 .next + server.js ===')
archive_path = os.path.join(LOCAL_DIR, 'deploy-next.tar.gz')
with tarfile.open(archive_path, 'w:gz') as tar:
    tar.add(os.path.join(LOCAL_DIR, '.next'), arcname='.next', filter=exclude_filter)
    server_js = os.path.join(LOCAL_DIR, 'server.js')
    if os.path.exists(server_js):
        tar.add(server_js, arcname='server.js')
size = os.path.getsize(archive_path)
print(f'  打包完成: {size // 1024 // 1024} MB')

print('\n=== 2. 上传 ===')
ssh = connect_ssh(HOST)
sftp = ssh.open_sftp()

_stdin, _stdout, _stderr = ssh.exec_command(f'ls {REMOTE_DIR}/.next/BUILD_ID 2>/dev/null', timeout=20)
_check = _stdout.read().decode('utf-8', errors='replace').strip()
if not _check:
    sftp.close()
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
def run(cmd, timeout=120):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if exit_code != 0:
        print(f'  [失败 exit={exit_code}] {cmd}')
        if err:
            print(f'    {err[:400]}')
        raise SystemExit(f'部署中止：远程命令执行失败 → {cmd}')
    return out


backup_dir = '%s-backup-%d' % (REMOTE_DIR, int(time.time()))
run('cp -r %s/.next %s' % (REMOTE_DIR, backup_dir))
mark = run('test -f %s/server.js && echo YES || echo NO' % REMOTE_DIR)
if mark == 'YES':
    run('cp %s/server.js %s/server.js' % (REMOTE_DIR, backup_dir))
print('  备份: %s' % backup_dir)

run('rm -rf /tmp/.next /tmp/server.js && cd /tmp && tar -xzf deploy-next.tar.gz')
run('rm -rf %s/.next/static %s/.next/server' % (REMOTE_DIR, REMOTE_DIR))
run('cp -r /tmp/.next/static %s/.next/static' % REMOTE_DIR)
run('cp -r /tmp/.next/server %s/.next/server' % REMOTE_DIR)
run('cp /tmp/.next/BUILD_ID %s/.next/BUILD_ID' % REMOTE_DIR)
for extra in ('routes-manifest.json', 'prerender-manifest.json'):
    mark = run('test -f /tmp/.next/%s && echo YES || echo NO' % extra)
    if mark == 'YES':
        run('cp /tmp/.next/%s %s/.next/%s' % (extra, REMOTE_DIR, extra))
    else:
        print('  ⚠️ 本地构建缺少 %s，未同步（headers/redirects 可能失效）' % extra)
run('cp /tmp/server.js %s/server.js' % REMOTE_DIR)
print('  解压覆盖完成（含 server.js）')

print('\n=== 4. 重启 PM2 ===')
run(f'pm2 restart {PM2_NAME} --update-env')
time.sleep(3)
out = run(f'pm2 status {PM2_NAME}')
print('  PM2 状态:')
for line in out.split('\n'):
    if PM2_NAME in line or 'status' in line.lower():
        print('    %s' % line)

print('\n=== 5. 构建一致性校验（防假部署） ===')
remote_build_id = run('cat %s/.next/BUILD_ID' % REMOTE_DIR).strip()
print(f'  远端 BUILD_ID: {remote_build_id}')
if remote_build_id != LOCAL_BUILD_ID:
    raise SystemExit('部署中止：远端 BUILD_ID 与本地构建不一致，本次部署未真正生效！请检查 REMOTE_DIRS 映射。')
print('  ✅ BUILD_ID 一致，代码已真实落盘')

old_backups = run('ls -dt %s-backup-* 2>/dev/null | tail -n +6' % REMOTE_DIR)
for b in old_backups.split('\n'):
    b = b.strip()
    if b:
        run('rm -rf %s' % b)
        print(f'  清理旧备份: {b}')

nginx_hit = run('grep -Rl "limit_req" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | head -1 || true')
if not nginx_hit.strip():
    print('  ⚠️ 服务器 nginx 未配置 limit_req 限流！请参照 deploy/nginx-ming8.conf 加固模板配置后 reload')

print('\n=== 6. 线上验证 ===')
time.sleep(2)
domain = DOMAINS[target]


def http_status(path):
    req = urllib.request.Request(f'https://{domain}{path}', headers={'User-Agent': 'deploy-check'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
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

os.remove(archive_path)

print('\n=== 部署完成 ===')
print(f'备份位置: {backup_dir}')
