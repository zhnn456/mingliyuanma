"""检查 chunks 文件"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip() or stderr.read().decode().strip()

print('=== 服务器上 chunks 目录所有文件 ===')
print(run('ls /www/ming8/standalone/.next/static/chunks/'))
print()
print('=== 检查失败的 3 个文件 ===')
for f in ['4bd1b696-c0ae39c8cf0d5561.js', '1255-38eeb9655c10f78d.js', '5000-183930cce4424cc5.js']:
    result = run(f'ls -la /www/ming8/standalone/.next/static/chunks/{f} 2>&1')
    print(f'  {f}: {result}')
print()
print('=== 文件数 ===')
print(run('ls /www/ming8/standalone/.next/static/chunks/ | wc -l'))

ssh.close()
