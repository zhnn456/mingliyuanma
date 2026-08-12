"""检查服务器文件结构"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out if out else err

print('=== standalone/.next/static/chunks ===')
print(run('ls /www/ming8/standalone/.next/static/chunks/ 2>&1 | head -5'))
print('文件数:', run('ls /www/ming8/standalone/.next/static/chunks/ 2>/dev/null | wc -l'))

print()
print('=== .next/static/chunks (非standalone) ===')
print(run('ls /www/ming8/.next/static/chunks/ 2>&1 | head -5'))
print('文件数:', run('ls /www/ming8/.next/static/chunks/ 2>/dev/null | wc -l'))

print()
print('=== Nginx ming8.online.conf ===')
print(run('cat /www/server/panel/vhost/nginx/ming8.online.conf 2>/dev/null || cat /etc/nginx/conf.d/ming8*.conf 2>/dev/null'))

print()
print('=== PM2 进程 ===')
print(run('su - admin -c "pm2 list" 2>&1 | grep ming8'))

ssh.close()
