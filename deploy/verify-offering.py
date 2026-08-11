import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

print("===== /api/offerings =====")
_, o, _ = ssh.exec_command('curl -s -w "\\nHTTP:%{http_code}" http://localhost:3001/api/offerings')
result = o.read().decode()
print(result[:300])

print("\n===== /api/offering/square =====")
_, o, _ = ssh.exec_command('curl -s -w "\\nHTTP:%{http_code}" http://localhost:3001/api/offering/square')
result = o.read().decode()
print(result[:300])

ssh.close()
