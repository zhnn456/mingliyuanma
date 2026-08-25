"""查看最新保存失败的错误日志"""
import os
import paramiko

t = paramiko.Transport(('47.79.237.103', 22))
t.connect(username='root', password=os.environ['DEPLOY_SSH_PASSWORD'])
ssh = paramiko.SSHClient()
ssh._transport = t

# 查看最新日志
stdin, stdout, stderr = ssh.exec_command('pm2 logs ming8 --nostream --lines 30 2>&1 | tail -40')
print(stdout.read().decode()[-2500:])

t.close()
