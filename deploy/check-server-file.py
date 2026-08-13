"""检查服务器上 membership.html 是否包含新内容"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=15, look_for_keys=False, allow_agent=False)

# 检查服务器上 membership.html 是否包含新内容
stdin, stdout, stderr = ssh.exec_command('grep -c "为什么选择知微阁" /www/ming8/.next/server/app/membership.html 2>/dev/null || echo 0')
count = stdout.read().decode().strip()
print(f'服务器 HTML 包含"为什么选择知微阁"次数: {count}')

# 检查文件修改时间
stdin, stdout, stderr = ssh.exec_command('ls -la /www/ming8/.next/server/app/membership.html')
print(f'文件信息: {stdout.read().decode().strip()}')

# 检查文件大小
stdin, stdout, stderr = ssh.exec_command('wc -c /www/ming8/.next/server/app/membership.html')
print(f'文件大小: {stdout.read().decode().strip()}')

# 检查本地文件大小对比
import os
local_size = os.path.getsize(r'f:\mingliyuanma\.next\standalone\.next\server\app\membership.html')
print(f'本地文件大小: {local_size}')

# 检查 PM2 状态
stdin, stdout, stderr = ssh.exec_command('pm2 list')
print(f'PM2 状态: {stdout.read().decode().strip()[:500]}')

ssh.close()
