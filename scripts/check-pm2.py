"""检查 PM2 配置并重启"""
import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', look_for_keys=False, allow_agent=False)

log = lambda m: print(f'[{time.strftime("%H:%M:%S")}] {m}')

# 1. 检查 ecosystem.config.js 的 cwd
log('检查 PM2 配置...')
stdin, stdout, stderr = ssh.exec_command('cat /www/ming8/ecosystem.config.js 2>&1')
print(stdout.read().decode('utf-8', errors='replace'))

# 2. 检查 PM2 进程信息
log('检查 PM2 进程...')
stdin, stdout, stderr = ssh.exec_command('pm2 describe ming8 2>&1 | grep -E "cwd|exec cwd|script path|exec mode" | head -10')
print(stdout.read().decode('utf-8', errors='replace'))

# 3. 检查 server.js 是否有静态文件配置
log('检查 server.js...')
stdin, stdout, stderr = ssh.exec_command('head -30 /www/ming8/server.js 2>&1')
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
