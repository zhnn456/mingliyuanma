"""重新部署 - 简化版"""
import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=900):
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    stdout.channel.settimeout(timeout)
    try:
        out = stdout.read().decode()
    except Exception as e:
        out = f'(read timeout, command may still be running: {e})'
    code = stdout.channel.recv_exit_status()
    if out: print(out[:2000])
    print(f'[exit: {code}]')
    return code

# 构建
run('cd /www/ming8 && NODE_OPTIONS="--max-old-space-size=1024" npm run build:server 2>&1 | tail -5', timeout=600)

# 重启
run('pm2 delete ming8 2>/dev/null; cd /www/ming8 && PORT=3001 pm2 start npm --name ming8 -- start 2>&1')

# 验证
time.sleep(8)
run('curl -s http://localhost:3001/api/health')

ssh.close()
print('\n✅ 完成')
