"""检查用户数据和PM2配置"""
import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace').strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618',
            look_for_keys=False, allow_agent=False, timeout=30)

# 查看所有用户（用正确的字段）
print('=== 所有用户 ===')
out = run(ssh, '''mysql -u ming8 -p'Ming8@2026!' ming8_db -e "SELECT id, email, name, role FROM User LIMIT 20" 2>/dev/null''')
print(out)

# 查看管理员
print('\n=== 管理员 ===')
out = run(ssh, '''mysql -u ming8 -p'Ming8@2026!' ming8_db -e "SELECT id, email, name, role FROM User WHERE role != 'user' LIMIT 10" 2>/dev/null''')
print(out)

# 查看所有角色
print('\n=== 所有角色 ===')
out = run(ssh, '''mysql -u ming8 -p'Ming8@2026!' ming8_db -e "SELECT DISTINCT role FROM User" 2>/dev/null''')
print(out)

# 查看 PM2 配置
print('\n=== PM2 ecosystem ===')
out = run(ssh, 'cat /www/ming8/ecosystem.config.js 2>/dev/null || echo "不存在"')
print(out[:2000])

# 查看 PM2 环境变量
print('\n=== PM2 env ===')
out = run(ssh, 'pm2 env ming8 2>/dev/null | grep -E "MYSQL|DATABASE|NEXTAUTH|APP_|CENTER|LICENSE" | head -20')
print(out)

ssh.close()
