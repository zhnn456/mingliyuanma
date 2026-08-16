"""重启 PM2 并验证"""
import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', look_for_keys=False, allow_agent=False)

log = lambda m: print(f'[{time.strftime("%H:%M:%S")}] {m}')

log('重启 PM2...')
stdin, stdout, stderr = ssh.exec_command('pm2 restart ming8 2>&1')
out = stdout.read().decode('utf-8', errors='replace')
# 替换可能导致编码问题的字符
out = out.encode('ascii', 'replace').decode('ascii')
print(out)

log('等待启动...')
time.sleep(4)

log('测试 localhost:3001...')
stdin, stdout, stderr = ssh.exec_command('curl -sI http://localhost:3001/product-brochure.html 2>&1 | head -5')
out = stdout.read().decode('utf-8', errors='replace')
print(out)

log('测试外部访问...')
stdin, stdout, stderr = ssh.exec_command('curl -sI https://ming8.online/product-brochure.html 2>&1 | head -5')
out = stdout.read().decode('utf-8', errors='replace')
print(out)

ssh.close()
