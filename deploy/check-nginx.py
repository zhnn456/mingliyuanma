"""查找 Nginx 配置和检查 _next 路径"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip() or stderr.read().decode().strip()

print('=== 查找 Nginx 配置文件 ===')
print(run('find /www/server/panel/vhost/nginx/ -name "*.conf" 2>/dev/null'))
print(run('find /etc/nginx/ -name "*.conf" 2>/dev/null | head -10'))
print()
print('=== 查找包含 ming8 的配置 ===')
print(run('grep -rl "ming8" /www/server/panel/vhost/nginx/ /etc/nginx/ 2>/dev/null'))
print()
print('=== 检查 3001 端口代理配置 ===')
print(run('grep -r "3001\\|ming8" /www/server/panel/vhost/nginx/ 2>/dev/null | head -20'))
print()
print('=== 直接检查 _next/static 路径是否在服务器上存在 ===')
print(run('ls /www/ming8/standalone/.next/static/chunks/ 2>&1 | head -5'))
print()
print('=== 检查 Nginx 是否代理了 _next/static ===')
print(run('grep -r "_next" /www/server/panel/vhost/nginx/ /etc/nginx/ 2>/dev/null | head -10'))
print()
print('=== 测试直接访问 3001 端口的 JS ===')
print(run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/_next/static/chunks/webpack-034fffd88cfe270d.js 2>/dev/null'))

ssh.close()
