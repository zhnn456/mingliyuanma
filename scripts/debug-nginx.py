"""查找并显示 nginx 配置"""
import os
import paramiko

t = paramiko.Transport(('47.79.237.103', 22))
t.connect(username='root', password=os.environ['DEPLOY_SSH_PASSWORD'])
ssh = paramiko.SSHClient()
ssh._transport = t

# 查找 nginx 配置
stdin, stdout, stderr = ssh.exec_command('nginx -T 2>&1 | grep -A 3 "ming8\\|location.*images\\|location.*static\\|root.*ming8" | head -40')
print('=== Nginx 相关配置 ===')
print(stdout.read().decode())

# 检查图片是否在 .next/static 里
stdin, stdout, stderr = ssh.exec_command('ls /www/ming8/.next/static/images/ 2>&1 | head -10')
print('=== .next/static/images/ ===')
print(stdout.read().decode())

# 检查图片直接访问路径
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/images/personal-wechat-qr.jpg; echo')
print('=== localhost:3001/images/ HTTP ===')
print(stdout.read().decode())

# 检查 nginx 配置文件位置
stdin, stdout, stderr = ssh.exec_command('find /etc/nginx -name "*.conf" 2>/dev/null | head -10')
print('=== Nginx 配置文件 ===')
print(stdout.read().decode())

t.close()
