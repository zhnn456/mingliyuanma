"""验证所有 API — 重点 license API"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'
PORT = 3001

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, _ = ssh.exec_command(cmd, get_pty=True)
    return stdout.read().decode().strip()

# 登录管理员
run('curl -s -c /tmp/ad.txt -X POST -H "Content-Type: application/json" -d \'{"email":"282063152@qq.com","password":"admin123"}\' http://localhost:3001/api/auth/login > /dev/null')

# 测试 license API（关键修复点）
print('=== license API 测试 ===')
out = run(f'curl -s -b /tmp/ad.txt --max-time 15 "http://localhost:{PORT}/api/admin/licenses?pageSize=1"')
print(f'licenses 响应: {out[:500]}')

print()
out = run(f'curl -s -b /tmp/ad.txt -o /dev/null -w "%{{http_code}}" --max-time 15 "http://localhost:{PORT}/api/admin/licenses?pageSize=1"')
print(f'HTTP 状态: {out[-3:]}')

# 错误日志（只看最近的）
print()
print('=== 最近 5 行错误日志 ===')
out = run('su - admin -c "pm2 logs ming8 --lines 5 --nostream --err" 2>&1 | tail -10')
print(out)

run('rm -f /tmp/ad.txt')
ssh.close()
