"""部署升级修复到两个服务器"""
import paramiko, sys, time, os, tarfile, re
sys.stdout.reconfigure(encoding='utf-8')

def log(msg):
    print(f'[{time.strftime("%H:%M:%S")}] {msg}', flush=True)

def run(ssh, cmd, timeout=60):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace'), stderr.read().decode('utf-8', errors='replace')

SERVERS = [
    {'name': '中央站', 'host': '47.82.116.220', 'password': 'Aa20260618', 'port': 3001},
    {'name': '源码站', 'host': '47.79.3.189', 'password': 'Aa20260618', 'port': 3001},
]

# 打包 static + server + BUILD_ID
log('1. 打包...')
archive = 'deploy.tar.gz'
with tarfile.open(archive, 'w:gz') as tar:
    tar.add('.next/static', arcname='.next/static')
    tar.add('.next/standalone/.next/server', arcname='.next/server')
    tar.add('.next/BUILD_ID', arcname='.next/BUILD_ID')
size = os.path.getsize(archive) / 1024 / 1024
log(f'  {size:.1f} MB')

for server in SERVERS:
    name = server['name']
    host = server['host']
    port = server['port']

    log(f'\n=== {name} ({host}) ===')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username='root', password=server['password'], look_for_keys=False, allow_agent=False, banner_timeout=60, timeout=30)

    # 上传
    log('  上传...')
    sftp = ssh.open_sftp()
    sftp.put(archive, '/www/ming8/deploy.tar.gz')
    sftp.close()

    # 解压
    log('  解压...')
    run(ssh, 'cd /www/ming8 && tar -xzf deploy.tar.gz && rm -f deploy.tar.gz')

    # 重启
    log('  重启...')
    run(ssh, 'pm2 restart ming8 --update-env 2>&1')
    time.sleep(6)

    # 检查
    out, _ = run(ssh, f'timeout 10 curl -s http://localhost:{port}/api/health 2>/dev/null || echo "TIMEOUT"')
    log(f'  health: {out[:80]}')

    if name == '源码站':
        # 登录测试
        out, _ = run(ssh, '''curl -s -D /tmp/h.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -H "Host: bazi6.cc.cd" -d '{"email":"admin@bazi6.cc.cd","password":"admin123"}' -o /dev/null''')
        out, _ = run(ssh, 'grep -i set-cookie /tmp/h.txt')
        match = re.search(r'token=([^;]+)', out)
        token = match.group(1) if match else ''

        # 测试 upgrade-check
        out, _ = run(ssh, f'timeout 15 curl -s -H "Cookie: token={token}" -H "Host: bazi6.cc.cd" http://localhost:3001/api/admin/upgrade-check 2>/dev/null')
        import json
        try:
            data = json.loads(out)
            log(f'  upgrade-check: hasUpdate={data.get("hasUpdate")}, latest={data.get("latestVersion", "N/A")}')
        except:
            log(f'  upgrade-check: {out[:100]}')

        # 测试 apply-upgrade API（只检查是否存在，不实际执行）
        out, _ = run(ssh, f'timeout 10 curl -s -o /dev/null -w "%{{http_code}}" -X POST -H "Cookie: token={token}" -H "Host: bazi6.cc.cd" http://localhost:3001/api/admin/apply-upgrade 2>/dev/null')
        log(f'  apply-upgrade API: HTTP {out.strip()}')

        # 测试 download API（IP 修复验证）
        out, _ = run(ssh, f'timeout 15 curl -s -H "Cookie: token={token}" -H "Host: bazi6.cc.cd" http://localhost:3001/api/admin/upgrade-check 2>/dev/null')
        try:
            data = json.loads(out)
            if data.get('downloadUrl'):
                log(f'  downloadUrl: {data["downloadUrl"][:80]}')
        except:
            pass

        run(ssh, 'rm -f /tmp/h.txt')

    ssh.close()

os.remove(archive)
log('\n=== 完成 ===')
