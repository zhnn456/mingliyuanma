"""上传 standalone/server.js 并用 node 启动"""
import paramiko
import time
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip() + stderr.read().decode().strip()

# 1. 上传 standalone/server.js 到 /www/ming8/server.js
sftp = ssh.open_sftp()
local_server_js = r'f:\mingliyuanma\.next\standalone\server.js'
remote_server_js = '/www/ming8/server.js'

print('=== 上传 server.js ===')
sftp.put(local_server_js, remote_server_js)
sftp.chmod(remote_server_js, 0o644)
print(f'已上传到 {remote_server_js}')
sftp.close()

# 2. 停止旧 PM2 进程
print('\n=== 停止旧 PM2 ===')
print(run('su - admin -c "pm2 delete ming8" 2>&1')[:200])

# 3. 用 node server.js 启动
print('\n=== 用 node server.js 启动 ===')
print(run('su - admin -c "cd /www/ming8 && PORT=3001 NODE_ENV=production pm2 start server.js --name ming8 -- --port 3001" 2>&1')[:300])

time.sleep(8)

# 4. 检查状态
print('\n=== PM2 状态 ===')
print(run('su - admin -c "pm2 list" 2>&1')[:400])

# 5. 测试
time.sleep(3)
print('\n=== 测试 ===')
print('首页:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/'))
print('bazi:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/bazi'))
print('demo-bazi:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/demo-bazi'))
print('membership:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/membership'))

# 6. 外部测试
print('\n=== 外部测试 ===')
print('demo-bazi:', run('curl -s -o /dev/null -w "%{http_code}" https://ming8.online/demo-bazi'))
print('首页:', run('curl -s -o /dev/null -w "%{http_code}" https://ming8.online/'))

# 7. 保存 PM2
print('\n=== 保存 PM2 ===')
print(run('su - admin -c "pm2 save" 2>&1')[:200])

ssh.close()
