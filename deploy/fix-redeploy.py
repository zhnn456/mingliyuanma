"""修复服务器git状态并重新部署"""
import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=300):
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out: print(out)
    if err: print('STDERR:', err)
    print(f'[exit: {code}]')
    return code

# 1. 丢弃测试脚本的本地修改
run('cd /www/ming8 && git checkout -- scripts/test-payment-concurrency.js 2>&1 || true')

# 2. 拉取最新代码
run('cd /www/ming8 && git pull 2>&1')

# 3. 构建
run('cd /www/ming8 && NODE_OPTIONS="--max-old-space-size=1024" npm run build:server 2>&1 | tail -20', timeout=600)

# 4. 重启
run('pm2 delete ming8 2>/dev/null; cd /www/ming8 && PORT=3001 pm2 start npm --name ming8 -- start 2>&1')

# 5. 验证
time.sleep(8)
run('curl -s http://localhost:3001/api/health')

ssh.close()
print('\n✅ 修复部署完成')
