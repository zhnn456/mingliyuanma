"""查看服务器上的 ecosystem.config.js 实际内容并修复"""
import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, _ = ssh.exec_command(cmd, get_pty=True)
    return stdout.read().decode().strip()

# 查看实际内容（带行号）
print('=== 服务器上 ecosystem.config.js 实际内容 ===')
out = run('cat -n /www/ming8/ecosystem.config.js')
print(out)

# 检查文件大小和编码
print('\n=== 文件信息 ===')
print(run('ls -la /www/ming8/ecosystem.config.js'))
print(run('file /www/ming8/ecosystem.config.js 2>/dev/null'))
print(run('xxd /www/ming8/ecosystem.config.js | head -3'))

# 直接用 SFTP 写入正确的 ecosystem.config.js
print('\n=== 重新用 SFTP 写入 ecosystem.config.js ===')
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
print('✓ 已用 SFTP 写入')

# 设置权限
run('chown admin:admin /www/ming8/ecosystem.config.js')

# 验证内容
print('\n=== 写入后内容 ===')
print(run('cat /www/ming8/ecosystem.config.js'))

# 启动 PM2
print('\n=== 启动 PM2 ===')
run('su - admin -c "pm2 delete ming8 2>/dev/null; true"')
out = run('su - admin -c "cd /www/ming8 && pm2 start ecosystem.config.js"')
print(out)

# 保存
run('su - admin -c "pm2 save --force" 2>/dev/null')

print('等待 12 秒...')
time.sleep(12)

# 验证
print('\n=== PM2 状态 ===')
print(run('su - admin -c "pm2 list"'))

print('\n=== 服务验证 ===')
print(run('curl -s -o /dev/null -w "首页: %{http_code}\\n" --max-time 20 http://localhost:3001'))
print(run('curl -s --max-time 10 http://localhost:3001/api/user/recharge | head -c 200'))

ssh.close()
