"""检查服务器上的 apply-upgrade 路由"""
import paramiko, sys, re
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace'), stderr.read().decode('utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.79.3.189', username='root', password='Aa20260618', look_for_keys=False, allow_agent=False, banner_timeout=60, timeout=30)

# 1. 检查 manifest
print('=== 1. manifest 检查 ===')
out, _ = run(ssh, 'grep "apply-upgrade" /www/ming8/.next/server/app-paths-manifest.json')
print(f'  manifest: {out.strip() or "未找到"}')

# 2. 检查 route.js
print('\n=== 2. route.js 检查 ===')
out, _ = run(ssh, 'ls -la /www/ming8/.next/server/app/api/admin/apply-upgrade/ 2>/dev/null || echo "NOT FOUND"')
print(f'  route.js: {out.strip()}')

# 3. 完全重启 PM2
print('\n=== 3. 完全重启 PM2 ===')
run(ssh, 'pm2 delete ming8 2>/dev/null')
out, _ = run(ssh, 'cd /www/ming8 && pm2 start ecosystem.config.js 2>&1 | tail -3')
print(f'  启动: {out[:100]}')

import time; time.sleep(8)

# 4. 登录并测试
print('\n=== 4. 测试 ===')
out, _ = run(ssh, '''curl -s -D /tmp/h.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -H "Host: bazi6.cc.cd" -d '{"email":"admin@bazi6.cc.cd","password":"admin123"}' -o /dev/null''')
out, _ = run(ssh, 'grep -i set-cookie /tmp/h.txt')
match = re.search(r'token=([^;]+)', out)
token = match.group(1) if match else ''

# 测试 apply-upgrade（GET 请求会返回 405，POST 会执行升级）
out, _ = run(ssh, f'timeout 10 curl -s -o /dev/null -w "%{{http_code}}" -H "Cookie: token={token}" -H "Host: bazi6.cc.cd" http://localhost:3001/api/admin/apply-upgrade 2>/dev/null')
print(f'  GET apply-upgrade: HTTP {out.strip()} (405=正常, 404=路由未注册)')

out, _ = run(ssh, f'timeout 30 curl -s -X POST -H "Cookie: token={token}" -H "Host: bazi6.cc.cd" http://localhost:3001/api/admin/apply-upgrade 2>/dev/null')
print(f'  POST apply-upgrade: {out[:200]}')

run(ssh, 'rm -f /tmp/h.txt')
ssh.close()
