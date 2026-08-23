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
run('cp /tmp/.next/packagePath.txt %s/.next/packagePath.txt 2>/dev/null; echo OK')
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

print('\n=== 5. 验证 ===')
import requests
time.sleep(2)
domains = {
    'ming8': 'ming8.online',
    'test-source': 'test-source.ming8.online',
    'source': 'bazi6.cc.cd',
}
domain = domains.get(target, 'ming8.online')
try:
    r = requests.get(f'https://{domain}/', timeout=10)
    print(f'  首页: {r.status_code}')
except Exception as e:
    print(f'  首页错误: {e}')

try:
    r = requests.get(f'https://{domain}/api/admin/stats', timeout=10)
    print(f'  API stats: {r.status_code}')
except Exception as e:
    print(f'  API错误: {e}')

sftp.close()
ssh.close()

# 清理本地文件
os.remove(archive_path)

print('\n=== 部署完成 ===')
print(f'备份位置: {backup_dir}')
