"""直接用 SFTP 写入正确的 ecosystem.config.js，并启动"""
import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'
PORT = 3001

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

# 用 SFTP 直接写入 ecosystem.config.js（避免 heredoc 转义问题）
ECOSYSTEM = """module.exports = {
  apps: [{
    name: 'ming8',
    cwd: '/www/ming8',
    script: 'standalone/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
    },
    max_memory_restart: '512M',
    instances: 1,
    autorestart: true,
    watch: false,
    error_file: '/www/ming8/logs/error.log',
    out_file: '/www/ming8/logs/out.log',
    merge_logs: true,
    time: true,
  }],
};
"""

sftp = ssh.open_sftp()
with sftp.open('/www/ming8/ecosystem.config.js', 'w') as f:
    f.write(ECOSYSTEM)
sftp.close()
print('✓ ecosystem.config.js 已写入')

# 设置权限
ssh.exec_command('chown admin:admin /www/ming8/ecosystem.config.js')
time.sleep(1)

# 显示文件内容验证
_, stdout, _ = ssh.exec_command('cat /www/ming8/ecosystem.config.js')
print('文件内容:')
print(stdout.read().decode())

# 删除旧 ming8 进程
print('\n>>> 删除旧 ming8 进程')
_, stdout, _ = ssh.exec_command('su - admin -c "pm2 delete ming8 2>/dev/null"', get_pty=True)
print(stdout.read().decode().rstrip())

# 启动 PM2
print('\n>>> 启动 PM2')
_, stdout, _ = ssh.exec_command('su - admin -c "cd /www/ming8 && pm2 start ecosystem.config.js"', get_pty=True)
print(stdout.read().decode().rstrip())

# 保存
print('\n>>> 保存 PM2 配置')
_, stdout, _ = ssh.exec_command('su - admin -c "pm2 save --force" 2>/dev/null', get_pty=True)
print(stdout.read().decode().rstrip())

print('等待 10 秒...')
time.sleep(10)

# 检查状态
print('\n>>> PM2 list')
_, stdout, _ = ssh.exec_command('su - admin -c "pm2 list"', get_pty=True)
print(stdout.read().decode().rstrip())

# 验证服务
print('\n>>> 验证服务')
_, stdout, _ = ssh.exec_command(f'curl -s -o /dev/null -w "首页: %{{http_code}}\\n" --max-time 20 http://localhost:{PORT}', get_pty=True)
print(stdout.read().decode().rstrip())

_, stdout, _ = ssh.exec_command(f'curl -s --max-time 10 http://localhost:{PORT}/api/user/recharge | head -c 300', get_pty=True)
print(f'充值套餐 API: {stdout.read().decode().rstrip()}')

_, stdout, _ = ssh.exec_command('ss -tlnp 2>/dev/null | grep 3001', get_pty=True)
print(f'端口监听: {stdout.read().decode().rstrip()}')

# 日志
print('\n>>> 错误日志')
_, stdout, _ = ssh.exec_command('su - admin -c "pm2 logs ming8 --lines 25 --nostream --err" 2>&1 | tail -30', get_pty=True)
print(stdout.read().decode().rstrip())

# 标准输出日志
print('\n>>> 标准输出日志')
_, stdout, _ = ssh.exec_command('su - admin -c "pm2 logs ming8 --lines 15 --nostream --out" 2>&1 | tail -20', get_pty=True)
print(stdout.read().decode().rstrip())

ssh.close()
