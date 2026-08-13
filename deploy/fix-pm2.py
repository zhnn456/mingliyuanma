"""修复 PM2 启动方式：从 next start 改为 node standalone/server.js"""
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip() + stderr.read().decode().strip()

# 1. 检查 standalone/server.js 是否存在
print('=== 检查 standalone/server.js ===')
print(run('ls -la /www/ming8/.next/standalone/server.js 2>/dev/null || echo "not found"'))

# 2. 删除旧 PM2 进程
print('\n=== 删除旧 PM2 进程 ===')
print(run('su - admin -c "pm2 delete ming8" 2>&1')[:200])

# 3. 用 node standalone/server.js 启动
# 设置环境变量 PORT=3001
print('\n=== 用 node standalone/server.js 启动 ===')
print(run('cd /www/ming8 && PORT=3001 NODE_ENV=production su - admin -c "cd /www/ming8 && PORT=3001 NODE_ENV=production pm2 start .next/standalone/server.js --name ming8" 2>&1')[:300])

time.sleep(5)

# 4. 检查状态
print('\n=== PM2 状态 ===')
print(run('su - admin -c "pm2 list" 2>&1')[:500])

# 5. 测试
time.sleep(2)
print('\n=== 测试 ===')
print('demo-bazi:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/demo-bazi'))
print('bazi:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/bazi'))
print('首页:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/'))

# 6. 保存 PM2 配置
print('\n=== 保存 PM2 配置 ===')
print(run('su - admin -c "pm2 save" 2>&1')[:200])

ssh.close()
