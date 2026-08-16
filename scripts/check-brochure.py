"""检查服务器文件位置和访问"""
import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', look_for_keys=False, allow_agent=False)

log = lambda m: print(f'[{time.strftime("%H:%M:%S")}] {m}')

# 1. 检查文件位置
log('检查文件位置...')
stdin, stdout, stderr = ssh.exec_command('ls -la /www/ming8/public/product-brochure.html 2>&1; echo "---"; ls -la /www/ming8/standalone/public/product-brochure.html 2>&1')
print(stdout.read().decode('utf-8', errors='replace'))

# 2. 检查 Next.js 能否提供
log('检查 localhost:3001...')
stdin, stdout, stderr = ssh.exec_command('curl -sI http://localhost:3001/product-brochure.html 2>&1 | head -5')
print(stdout.read().decode('utf-8', errors='replace'))

# 3. 如果 standalone/public 没有，复制过去
log('复制到 standalone/public...')
stdin, stdout, stderr = ssh.exec_command('cp /www/ming8/public/product-brochure.html /www/ming8/standalone/public/product-brochure.html 2>&1')
print(stdout.read().decode('utf-8', errors='replace'))

# 4. 重新检查 localhost
log('重新检查 localhost:3001...')
stdin, stdout, stderr = ssh.exec_command('curl -sI http://localhost:3001/product-brochure.html 2>&1 | head -5')
print(stdout.read().decode('utf-8', errors='replace'))

# 5. 检查外部访问
log('检查外部访问...')
stdin, stdout, stderr = ssh.exec_command('curl -sI https://ming8.online/product-brochure.html 2>&1 | head -5')
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
