"""查看3个500错误的PM2日志"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

def run(ssh, cmd, timeout=30):
    print(f">>> {cmd[:200]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    if out: print(out.strip()[:3000])
    if err and 'Warning' not in err:
        print(f"[stderr] {err.strip()[:1000]}")
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

# 触发3个500错误
run(ssh, 'curl -s -c /tmp/agent_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\' > /dev/null')

run(ssh, 'curl -s -b /tmp/agent_cookies.txt http://localhost:3001/api/agent/agent-orders > /dev/null')
run(ssh, 'curl -s -b /tmp/agent_cookies.txt "http://localhost:3001/api/agent/commissions?pageSize=1" > /dev/null')
run(ssh, 'curl -s -b /tmp/agent_cookies.txt http://localhost:3001/api/agent/settlements > /dev/null')

# 查看错误日志
print("\n=== PM2 错误日志（最后30行）===")
run(ssh, 'su - admin -c "pm2 logs ming8 --lines 50 --nostream --err" 2>&1 | tail -60')

run(ssh, 'rm -f /tmp/agent_cookies.txt')
ssh.close()
