"""修复 PM2 启动 — 使用 su admin (不加 -) 保留 cwd"""
import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'
PORT = 3001

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=60):
    print(f'>>> {cmd[:200]}')
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode(errors='replace')
    print(out.rstrip()[:2000])
    print('---')
    return out

# 1. 确认 ecosystem.config.js 路径正确
run('ls -la /www/ming8/ecosystem.config.js')

# 2. 用 su admin (不加 -) 保留 cwd，正确启动 PM2
run('su - admin -c "pm2 delete ming8 2>/dev/null"')
# 关键：su 后 cd 到 /www/ming8 再启动
run('su - admin -c "cd /www/ming8 && pm2 start ecosystem.config.js"')

# 3. 保存 PM2
run('su - admin -c "pm2 save" 2>/dev/null')

# 4. 等待启动
print('等待 8 秒...')
time.sleep(8)

# 5. 检查状态
run('su - admin -c "pm2 list"')
run('su - admin -c "pm2 describe ming8" 2>&1 | head -30')

# 6. 验证服务
run(f'curl -s -o /dev/null -w "首页: %{{http_code}}\\n" --max-time 20 http://localhost:{PORT}')
run(f'curl -s --max-time 10 http://localhost:{PORT}/api/user/recharge | head -c 200')

# 7. 查看日志
run('su - admin -c "pm2 logs ming8 --lines 20 --nostream --err" 2>&1 | tail -30')

ssh.close()
