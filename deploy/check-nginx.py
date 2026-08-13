"""检查 Nginx 配置"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip()

# 检查 ming8.online 的 Nginx 配置
print('=== Nginx 配置文件 ===')
print(run('cat /www/server/panel/vhost/nginx/ming8.online.conf 2>/dev/null || cat /etc/nginx/conf.d/ming8.online.conf 2>/dev/null || nginx -T 2>&1 | grep -A 30 "ming8"'))

# 重启 Nginx
print('\n=== 重启 Nginx ===')
print(run('nginx -t 2>&1 && nginx -s reload 2>&1'))

ssh.close()
