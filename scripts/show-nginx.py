"""显示 ming8 nginx 配置"""
import os
import paramiko

t = paramiko.Transport(('47.79.237.103', 22))
t.connect(username='root', password=os.environ['DEPLOY_SSH_PASSWORD'])
ssh = paramiko.SSHClient()
ssh._transport = t

stdin, stdout, stderr = ssh.exec_command('cat /etc/nginx/sites-enabled/ming8')
print(stdout.read().decode())

t.close()
