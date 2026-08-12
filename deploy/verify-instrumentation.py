"""检查 instrumentation 启动日志和授权验证状态"""
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

# 查看 PM2 启动日志（标准输出）
print('=== PM2 启动日志（含 [License] 日志）===')
print(run('su - admin -c "pm2 logs ming8 --lines 30 --nostream --out" 2>&1 | tail -40'))

# 查看错误日志
print('\n=== 错误日志 ===')
print(run('su - admin -c "pm2 logs ming8 --lines 10 --nostream --err" 2>&1 | tail -15'))

# 验证首页正常
print('\n=== 服务验证 ===')
print(run(f'curl -s -o /dev/null -w "首页: %{{http_code}}\\n" --max-time 15 http://localhost:3001'))
print(run(f'curl -s --max-time 10 http://localhost:3001/api/user/recharge | head -c 200'))

ssh.close()
