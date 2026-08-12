"""测试 dashboard API 实际返回"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, _ = ssh.exec_command(cmd, get_pty=True)
    return stdout.read().decode().strip()

# 登录代理商
print('=== 登录 ===')
print(run('curl -s -c /tmp/ac.txt -X POST -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\' http://localhost:3001/api/auth/login | head -c 200'))

# dashboard API 返回
print('\n=== dashboard API 返回 ===')
out = run('curl -s -b /tmp/ac.txt --max-time 15 http://localhost:3001/api/agent/dashboard')
print(out[:2000])

# commissions API
print('\n=== commissions API 返回 ===')
out = run('curl -s -b /tmp/ac.txt --max-time 15 "http://localhost:3001/api/agent/commissions?pageSize=5"')
print(out[:1000])

# settlements API
print('\n=== settlements API 返回 ===')
out = run('curl -s -b /tmp/ac.txt --max-time 15 "http://localhost:3001/api/agent/settlements"')
print(out[:1000])

run('rm -f /tmp/ac.txt')
ssh.close()
