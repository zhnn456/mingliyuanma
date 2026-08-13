"""紧急恢复 PM2 - 用 next start 重新启动"""
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip() + stderr.read().decode().strip()

# 检查 next 命令是否存在
print('=== 检查 next 命令 ===')
print(run('ls -la /www/ming8/node_modules/.bin/next 2>/dev/null || echo "not found"'))

# 用 next start 重新启动
print('\n=== 用 next start 恢复 ===')
print(run('su - admin -c "cd /www/ming8 && pm2 start node_modules/.bin/next --name ming8 -- start -p 3001" 2>&1')[:300])

time.sleep(5)

# 检查状态
print('\n=== PM2 状态 ===')
print(run('su - admin -c "pm2 list" 2>&1')[:400])

# 测试
time.sleep(3)
print('\n=== 测试 ===')
print('首页:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/'))
print('bazi:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/bazi'))
print('demo-bazi:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/demo-bazi'))

# 保存
print('\n=== 保存 PM2 ===')
print(run('su - admin -c "pm2 save" 2>&1')[:200])

ssh.close()
