"""查看 SiteConfig 表结构"""
import os
import paramiko

t = paramiko.Transport(('47.79.237.103', 22))
t.connect(username='root', password=os.environ['DEPLOY_SSH_PASSWORD'])
ssh = paramiko.SSHClient()
ssh._transport = t

# 查看 SiteConfig 表结构
stdin, stdout, stderr = ssh.exec_command('mysql -u ming8 -p"Ming8@2026!" ming8_db -e "DESCRIBE SiteConfig;"')
print('=== SiteConfig 表结构 ===')
print(stdout.read().decode())

t.close()
