"""检查并修复 BUILD_ID 不匹配"""
import paramiko, sys, os, tarfile, time, re
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace'), stderr.read().decode('utf-8', errors='replace')

# 检查本地 BUILD_ID
with open('.next/BUILD_ID', 'r') as f:
    local_build_id = f.read().strip()
print(f'本地 BUILD_ID: {local_build_id}')

# 检查本地 static 子目录
static_dirs = os.listdir('.next/static')
print(f'本地 static 子目录: {static_dirs}')

# 部署到两个服务器
SERVERS = [
    {'name': '中央站', 'host': '47.82.116.220', 'password': 'Aa20260618', 'port': 3001},
    {'name': '源码站', 'host': '47.79.3.189', 'password': 'Aa20260618', 'port': 3001},
]

# 打包完整的 .next 目录（standalone + static）
print('\n打包完整 .next...')
archive = 'full-next.tar.gz'
# 打包 standalone/.next 和 .next/static 和 .next/BUILD_ID
with tarfile.open(archive, 'w:gz') as tar:
    # 打包 standalone 的 server
    tar.add('.next/standalone/.next/server', arcname='.next/server')
    # 打包 static
    tar.add('.next/static', arcname='.next/static')
    # 打包 BUILD_ID
    tar.add('.next/BUILD_ID', arcname='.next/BUILD_ID')
    # 打包 required-server-files.json（包含路由配置）
    rsf = '.next/standalone/.next/server/required-server-files.json'
    if os.path.exists(rsf):
        tar.add(rsf, arcname='.next/server/required-server-files.json')
    # 打包其他 manifest 文件
    for f in ['app-paths-manifest.json', 'app-path-routes-manifest.json', 'middleware-manifest.json', 'server-reference-manifest.json']:
        p = f'.next/standalone/.next/server/{f}'
        if os.path.exists(p):
            tar.add(p, arcname=f'.next/server/{f}')

size = os.path.getsize(archive) / 1024 / 1024
print(f'包大小: {size:.1f} MB')

for server in SERVERS:
    name = server['name']
    host = server['host']

    print(f'\n=== {name} ({host}) ===')
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username='root', password=server['password'], look_for_keys=False, allow_agent=False, banner_timeout=60, timeout=30)

    # 检查当前 BUILD_ID
    out, _ = run(ssh, 'cat /www/ming8/.next/BUILD_ID')
    print(f'  当前 BUILD_ID: {out.strip()}')

    out, _ = run(ssh, 'ls /www/ming8/.next/static/ | head -5')
    print(f'  static 子目录: {out.strip()}')

    # 上传
    print('  上传...')
    sftp = ssh.open_sftp()
    sftp.put(archive, '/www/ming8/full-next.tar.gz')
    sftp.close()

    # 完全替换 .next/server 和 .next/static
    print('  解压...')
    run(ssh, 'cd /www/ming8 && rm -rf .next/server .next/static && tar -xzf full-next.tar.gz && rm -f full-next.tar.gz')

    # 验证
    out, _ = run(ssh, 'cat /www/ming8/.next/BUILD_ID')
    print(f'  新 BUILD_ID: {out.strip()}')

    out, _ = run(ssh, 'ls /www/ming8/.next/static/')
    print(f'  static 子目录: {out.strip()}')

    out, _ = run(ssh, 'grep "apply-upgrade" /www/ming8/.next/server/app-paths-manifest.json | head -1')
    print(f'  manifest: {out.strip()[:60]}')

    # 完全重启
    print('  重启...')
    run(ssh, 'pm2 delete ming8 2>/dev/null')
    run(ssh, 'cd /www/ming8 && pm2 start ecosystem.config.js 2>&1')
    time.sleep(8)

    # 测试
    out, _ = run(ssh, f'timeout 10 curl -s http://localhost:{server["port"]}/api/health 2>/dev/null || echo "TIMEOUT"')
    print(f'  health: {out[:60]}')

    # 测试 apply-upgrade
    out, _ = run(ssh, '''curl -s -D /tmp/h.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -H "Host: bazi6.cc.cd" -d '{"email":"admin@bazi6.cc.cd","password":"admin123"}' -o /dev/null''')
    out, _ = run(ssh, 'grep -i set-cookie /tmp/h.txt')
    match = re.search(r'token=([^;]+)', out)
    token = match.group(1) if match else ''

    out, _ = run(ssh, f'timeout 10 curl -s -o /dev/null -w "%{{http_code}}" -H "Cookie: token={token}" -H "Host: bazi6.cc.cd" http://localhost:3001/api/admin/apply-upgrade 2>/dev/null')
    print(f'  GET apply-upgrade: HTTP {out.strip()} (405=正常)')

    run(ssh, 'rm -f /tmp/h.txt')
    ssh.close()

os.remove(archive)
print('\n=== 完成 ===')
