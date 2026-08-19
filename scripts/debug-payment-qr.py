"""排查保存失败 + 图片404 问题"""
import paramiko

t = paramiko.Transport(('47.79.237.103', 22))
t.connect(username='root', password='Aa20260618')
ssh = paramiko.SSHClient()
ssh._transport = t

# 1. 查看 pm2 日志最后 50 行（找保存失败的错误）
stdin, stdout, stderr = ssh.exec_command('pm2 logs ming8 --nostream --lines 50 2>&1 | tail -60')
print('=== PM2 日志 ===')
print(stdout.read().decode()[-3000:])

# 2. 检查 public/images 目录在服务器上的位置
stdin, stdout, stderr = ssh.exec_command('ls -la /www/ming8/public/images/ 2>&1 | head -20')
print('\n=== /www/ming8/public/images/ ===')
print(stdout.read().decode())

# 3. 检查 .next 目录下是否有 standalone
stdin, stdout, stderr = ssh.exec_command('ls /www/ming8/.next/standalone/ 2>&1 | head -10')
print('\n=== .next/standalone/ ===')
print(stdout.read().decode())

# 4. 检查 nginx 配置（看静态文件路由）
stdin, stdout, stderr = ssh.exec_command('cat /etc/nginx/conf.d/ming8.conf 2>&1 | head -80')
print('\n=== Nginx 配置 ===')
print(stdout.read().decode())

t.close()
