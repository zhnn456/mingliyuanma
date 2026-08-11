"""检查服务器构建状态并重启"""
import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

# 检查是否有build进程在运行
stdin, stdout, stderr = ssh.exec_command('pgrep -f "next build" | head -3; echo "---"; pm2 list 2>&1 | head -10', timeout=15)
print(stdout.read().decode())

# 检查git log确认代码版本
stdin, stdout, stderr = ssh.exec_command('cd /www/ming8 && git log --oneline -3', timeout=10)
print('Git log:')
print(stdout.read().decode())

# 检查health
stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:3001/api/health', timeout=10)
print('Health:')
print(stdout.read().decode())

ssh.close()
