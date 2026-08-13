"""检查服务器文件结构和运行状态"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out, err

# 1. 检查 PM2 进程（admin 用户）
out, _ = run('su - admin -c "pm2 list" 2>&1')
print('=== PM2 进程列表 (admin) ===')
print(out[:800])

# 2. 检查 PM2 ecosystem 配置
out, _ = run('cat /www/ming8/ecosystem.config.js 2>/dev/null || echo "not found"')
print('\n=== ecosystem.config.js ===')
print(out[:500])

# 3. 检查两个路径下的 membership.html
out, _ = run('ls -la /www/ming8/.next/server/app/membership.html 2>/dev/null || echo "not found"')
print('\n=== /www/ming8/.next/server/app/membership.html ===')
print(out)

out, _ = run('ls -la /www/ming8/standalone/.next/server/app/membership.html 2>/dev/null || echo "not found"')
print('\n=== /www/ming8/standalone/.next/server/app/membership.html ===')
print(out)

# 4. 检查 standalone 目录下的文件是否包含新内容
out, _ = run('grep -c "为什么选择知微阁" /www/ming8/standalone/.next/server/app/membership.html 2>/dev/null || echo 0')
print(f'\nstandalone 目录下包含新内容次数: {out}')

# 5. 检查运行中的 Node.js 进程
out, _ = run('ps aux | grep node | grep -v grep')
print('\n=== 运行中的 Node.js 进程 ===')
print(out[:500])

# 6. 检查 PM2 进程的 cwd
out, _ = run('su - admin -c "pm2 show ming8" 2>&1 | head -30')
print('\n=== PM2 ming8 详情 ===')
print(out)

ssh.close()
