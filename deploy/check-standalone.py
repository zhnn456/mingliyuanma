"""检查 standalone 目录结构"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip() or stderr.read().decode().strip()

print('=== /www/ming8/standalone 目录 ===')
print(run('ls -la /www/ming8/standalone/ 2>&1'))
print()
print('=== /www/ming8/standalone/.next 目录 ===')
print(run('ls -la /www/ming8/standalone/.next/ 2>&1'))
print()
print('=== /www/ming8/standalone/.next/static 目录 ===')
print(run('ls -la /www/ming8/standalone/.next/static/ 2>&1'))
print()
print('=== Nginx ming8 配置完整内容 ===')
print(run('cat /etc/nginx/sites-available/ming8'))
print()
print('=== Nginx _next/static 配置 ===')
print(run('grep -A5 "_next" /etc/nginx/sites-available/ming8'))

ssh.close()
