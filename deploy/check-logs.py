import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

# 查看 PM2 错误日志
print("===== PM2 错误日志 =====")
_, o, _ = ssh.exec_command('su - admin -c "pm2 logs ming8 --nostream --lines 30 --err" 2>&1')
print(o.read().decode())

# 直接测试 API
print("\n===== /api/offerings 详细 =====")
_, o, _ = ssh.exec_command('curl -s -w "\\nHTTP:%{http_code}" http://localhost:3001/api/offerings')
print(o.read().decode())

ssh.close()
