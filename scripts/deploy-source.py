"""
部署到源码站 bazi6.cc.cd (47.79.3.189)
参考 deploy.py，但指向源码站
"""
import paramiko, os, sys, time, tarfile
sys.stdout.reconfigure(encoding='utf-8')

HOST = '47.79.3.189'  # 源码站
USER = 'root'
PASS = 'Aa20260618'
REMOTE_DIR = '/www/ming8'
LOCAL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

print('=== 部署到源码站 bazi6.cc.cd (47.79.3.189) ===\n')

# 1. 打包 .next
archive_name = 'deploy-next.tar.gz'
archive_path = os.path.join(LOCAL_DIR, archive_name)
print('[1] 打包 .next ...')
with tarfile.open(archive_path, 'w:gz') as tar:
    next_dir = os.path.join(LOCAL_DIR, '.next')
    tar.add(next_dir, arcname='.next', filter=lambda info: None if 'cache' in info.name else info)
size_mb = os.path.getsize(archive_path) / 1024 / 1024
print('    打包完成: {:.1f} MB'.format(size_mb))

# 2. 连接源码站
print('\n[2] 连接源码站 {}...'.format(HOST))
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, look_for_keys=False, allow_agent=False, timeout=30)
print('    SSH 连接成功')

# 3. 上传
print('\n[3] 上传 {}...'.format(archive_name))
sftp = ssh.open_sftp()
sftp.put(archive_path, '/tmp/deploy-next.tar.gz')
sftp.close()
print('    上传完成')

# 4. 备份 + 解压覆盖 + 重启
print('\n[4] 备份当前 .next 并覆盖...')

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print('    {}'.format(out))
    if err and 'Warning' not in err:
        print('    [err] {}'.format(err))
    return out

# 备份
backup_dir = '{}-backup-{}'.format(REMOTE_DIR, int(time.time()))
run('cp -r {}/.next {}'.format(REMOTE_DIR, backup_dir))
print('    备份到: {}'.format(backup_dir))

# 解压
run('cd /tmp && tar -xzf deploy-next.tar.gz')

# 覆盖 static 和 server（保留源码站的 .env 不变）
run('rm -rf {}/.next/static {}/.next/server'.format(REMOTE_DIR, REMOTE_DIR))
run('cp -r /tmp/.next/static {}/.next/static'.format(REMOTE_DIR))
run('cp -r /tmp/.next/server {}/.next/server'.format(REMOTE_DIR))
run('cp /tmp/.next/BUILD_ID {}/.next/BUILD_ID'.format(REMOTE_DIR))

# 重启 PM2
print('\n[5] 重启 PM2...')
run('pm2 restart ming8 --update-env')
time.sleep(3)
run('pm2 list')

# 6. 验证
print('\n[6] 验证...')
run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/ 2>&1", )
run("curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/admin 2>&1")
run("curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@bazi6.cc.cd\",\"password\":\"test\"}' 2>&1 | head -1")

# 清理
run('rm -f /tmp/deploy-next.tar.gz')
run('rm -rf /tmp/.next')
os.remove(archive_path)

print('\n=== 部署完成 ===')
print('备份位置: {}'.format(backup_dir))
ssh.close()
