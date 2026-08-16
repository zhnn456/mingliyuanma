"""清理旧 BUILD_ID 并完全重启"""
import paramiko, sys, time, re
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, cmd, timeout=60):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace'), stderr.read().decode('utf-8', errors='replace')

# 源码站
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.79.3.189', username='root', password='Aa20260618', look_for_keys=False, allow_agent=False, banner_timeout=60, timeout=30)

# 1. 检查当前 BUILD_ID
out, _ = run(ssh, 'cat /www/ming8/.next/BUILD_ID')
build_id = out.strip()
print(f'当前 BUILD_ID: {build_id}')

# 2. 删除旧 BUILD_ID 子目录（保留当前的）
print('\n删除旧 BUILD_ID 子目录...')
run(ssh, f'cd /www/ming8/.next/static && for d in */; do if [ "$d" != "{build_id}/" ] && [ "$d" != "chunks/" ] && [ "$d" != "css/" ]; then rm -rf "$d"; fi; done')

# 3. 清除 .next/cache
print('清除缓存...')
run(ssh, 'rm -rf /www/ming8/.next/cache 2>/dev/null')

# 4. 完全重启 PM2
print('完全重启 PM2...')
run(ssh, 'pm2 delete ming8 2>/dev/null')
run(ssh, 'cd /www/ming8 && pm2 start ecosystem.config.js 2>&1')
time.sleep(8)

# 5. 检查日志
print('\n启动日志:')
out, _ = run(ssh, 'pm2 logs ming8 --lines 5 --nostream 2>&1')
for line in out.strip().split('\n')[-5:]:
    print(f'  {line}')

# 6. 测试
print('\n测试:')
out, _ = run(ssh, 'timeout 10 curl -s http://localhost:3001/api/health 2>/dev/null || echo "TIMEOUT"')
print(f'  health: {out[:60]}')

# 登录
out, _ = run(ssh, '''curl -s -D /tmp/h.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -H "Host: bazi6.cc.cd" -d '{"email":"admin@bazi6.cc.cd","password":"admin123"}' -o /dev/null''')
out, _ = run(ssh, 'grep -i set-cookie /tmp/h.txt')
match = re.search(r'token=([^;]+)', out)
token = match.group(1) if match else ''

# 测试 apply-upgrade
out, _ = run(ssh, f'timeout 10 curl -s -o /dev/null -w "%{{http_code}}" -H "Cookie: token={token}" -H "Host: bazi6.cc.cd" http://localhost:3001/api/admin/apply-upgrade 2>/dev/null')
print(f'  GET apply-upgrade: HTTP {out.strip()} (405=正常)')

# 如果还是 404，测试一个已知存在的 API
out, _ = run(ssh, f'timeout 10 curl -s -o /dev/null -w "%{{http_code}}" -H "Cookie: token={token}" -H "Host: bazi6.cc.cd" http://localhost:3001/api/admin/upgrade-check 2>/dev/null')
print(f'  GET upgrade-check: HTTP {out.strip()} (200=正常)')

# 测试 updates 页面
out, _ = run(ssh, f'timeout 10 curl -s -o /dev/null -w "%{{http_code}}" -H "Cookie: token={token}" -H "Host: bazi6.cc.cd" http://localhost:3001/admin/updates 2>/dev/null')
print(f'  /admin/updates: HTTP {out.strip()} (200=正常)')

run(ssh, 'rm -f /tmp/h.txt')
ssh.close()
