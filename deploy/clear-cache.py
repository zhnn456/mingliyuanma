"""清除 .next/cache 并完全重启 PM2"""
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip() + stderr.read().decode().strip()

# 1. 停止 PM2
print('=== 停止 PM2 ===')
print(run('su - admin -c "pm2 stop ming8" 2>&1')[:200])

# 2. 清除 .next/cache
print('\n=== 清除 .next/cache ===')
print(run('rm -rf /www/ming8/.next/cache && echo "cache cleared"'))

# 3. 重新启动 PM2
print('\n=== 重启 PM2 ===')
print(run('su - admin -c "cd /www/ming8 && pm2 restart ming8" 2>&1')[:200])

time.sleep(8)

# 4. 测试
print('\n=== 测试 ===')
print('首页:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/'))
print('bazi:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/bazi'))
print('demo-bazi:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/demo-bazi'))
print('membership:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/membership'))

# 5. 外部测试
print('\n=== 外部测试 ===')
print('demo-bazi (外部):', run('curl -s -o /dev/null -w "%{http_code}" https://ming8.online/demo-bazi'))

ssh.close()
