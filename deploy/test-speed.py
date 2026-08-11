import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

for i in range(3):
    _, o, _ = ssh.exec_command('curl -s -o /dev/null -w "HTTP:%{http_code} 耗时:%{time_total}s TTFB:%{time_starttransfer}s" http://localhost:3001')
    print(f"第{i+1}次:", o.read().decode().strip())

_, o, _ = ssh.exec_command('free -h')
print("\n" + o.read().decode())

ssh.close()
