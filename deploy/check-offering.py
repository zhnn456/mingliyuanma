import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

# 检查数据库
print("===== 数据库检查 =====")
_, o, _ = ssh.exec_command("mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SELECT COUNT(*) as cnt FROM OfferingSupply; SELECT COUNT(*) as cnt FROM OfferingCategory;' 2>&1")
print(o.read().decode())

# 检查 OfferingItem 表是否存在
print("===== OfferingItem 表 =====")
_, o, _ = ssh.exec_command("mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SHOW TABLES LIKE \"OfferingItem\";' 2>&1")
print(o.read().decode())

# 检查 API 响应
print("===== /api/offerings =====")
_, o, _ = ssh.exec_command('curl -s http://localhost:3001/api/offerings 2>&1 | head -200')
print(o.read().decode()[:500])

print("\n===== /api/offering/square =====")
_, o, _ = ssh.exec_command('curl -s http://localhost:3001/api/offering/square 2>&1 | head -200')
print(o.read().decode()[:500])

ssh.close()
