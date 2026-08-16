"""远程重置 admin@test.com 密码并验证"""
import paramiko, time
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', look_for_keys=False, allow_agent=False)
log = lambda m: print(f'[{time.strftime("%H:%M:%S")}] {m}')
log('上传脚本...')
sftp = ssh.open_sftp()
sftp.put('scripts/reset-single-account.mjs', '/www/ming8/scripts/reset-single-account.mjs')
log('执行...')
stdin, stdout, stderr = ssh.exec_command('cd /www/ming8 && source .env 2>/dev/null; node scripts/reset-single-account.mjs 2>&1')
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
