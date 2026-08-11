import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

# 测试不同路径
paths = ['/', '/api/health', '/login', '/_next/static/chunks/main-app.js']
for p in paths:
    cmd = f'curl -s -o /dev/null -w "%{{http_code}} %{{time_total}}s" http://localhost:3001{p}'
    _, o, _ = ssh.exec_command(cmd)
    print(f"{p:40s} => {o.read().decode().strip()}")

# 检查 MySQL 查询速度
print("\nMySQL 查询速度:")
_, o, _ = ssh.exec_command("mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SELECT COUNT(*) FROM User;' 2>&1")
print("User count:", o.read().decode().strip())

# 检查请求时 CPU
print("\nCPU 使用:")
_, o, _ = ssh.exec_command('top -bn1 | head -5')
print(o.read().decode())

ssh.close()
