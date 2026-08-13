"""手动重启 PM2 并验证 demo-bazi"""
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out, err

# 重启 PM2
print('=== 重启 PM2 ===')
out, err = run('su - admin -c "pm2 restart ming8" 2>&1')
print(out[:300])
if err:
    print('stderr:', err[:200])

time.sleep(3)

# 检查 PM2 状态
out, _ = run('su - admin -c "pm2 list" 2>&1')
print('\n=== PM2 状态 ===')
print(out[:500])

# 等待启动完成后验证
time.sleep(3)
out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/demo-bazi')
print(f'\n=== demo-bazi 状态码: {out} ===')

out, _ = run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/')
print(f'首页状态码: {out}')

ssh.close()
