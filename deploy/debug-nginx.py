"""完整检查 Nginx 配置和调试 404"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip() + stderr.read().decode().strip()

# 检查所有 Nginx 配置文件
print('=== 所有 Nginx 配置文件 ===')
print(run('nginx -T 2>&1 | grep "server_name"'))

# 检查是否有其他配置拦截了 demo-bazi
print('\n=== 检查 demo 相关 Nginx 配置 ===')
print(run('nginx -T 2>&1 | grep -i "demo"'))

# 直接 curl 服务器 IP 测试
print('\n=== 直接 curl 服务器 IP ===')
print(run('curl -s -o /dev/null -w "%{http_code}" -H "Host: ming8.online" http://127.0.0.1/demo-bazi'))
print(run('curl -s -o /dev/null -w "%{http_code}" -H "Host: ming8.online" http://127.0.0.1:80/demo-bazi'))

# HTTPS 测试
print('\n=== HTTPS curl 测试 ===')
print(run('curl -sk -o /dev/null -w "%{http_code}" https://ming8.online/demo-bazi'))
print(run('curl -sk -o /dev/null -w "%{http_code}" https://ming8.online/bazi'))

# 检查 Next.js 日志
print('\n=== PM2 错误日志 ===')
print(run('su - admin -c "pm2 logs ming8 --err --lines 10 --nostream" 2>&1')[-500:])

ssh.close()
