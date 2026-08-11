"""等待构建完成并重启"""
import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

# 等待构建完成（检查build进程）
for i in range(30):
    stdin, stdout, stderr = ssh.exec_command('pgrep -f "next build" | head -1', timeout=10)
    pid = stdout.read().decode().strip()
    if not pid:
        print(f'构建已完成 (检查 {i+1}/30)')
        break
    print(f'构建仍在运行 (PID {pid}), 等待30秒... (检查 {i+1}/30)')
    time.sleep(30)

# 重启PM2
print('\n重启PM2...')
stdin, stdout, stderr = ssh.exec_command('pm2 delete ming8 2>/dev/null; cd /www/ming8 && PORT=3001 pm2 start npm --name ming8 -- start 2>&1', timeout=30)
print(stdout.read().decode())

# 等待启动
time.sleep(8)

# 验证
stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:3001/api/health', timeout=10)
print('健康检查:')
print(stdout.read().decode())

ssh.close()
