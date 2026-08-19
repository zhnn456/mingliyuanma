"""显示 ming8 nginx 配置"""
import paramiko

t = paramiko.Transport(('47.79.237.103', 22))
t.connect(username='root', password='Aa20260618')
ssh = paramiko.SSHClient()
ssh._transport = t

stdin, stdout, stderr = ssh.exec_command('cat /etc/nginx/sites-enabled/ming8')
print(stdout.read().decode())

t.close()
