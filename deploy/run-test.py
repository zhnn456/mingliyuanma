"""上传并运行并发测试脚本"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

# 上传测试脚本
sftp = paramiko.SFTPClient.from_transport(ssh.get_transport())
sftp.put('scripts/test-payment-concurrency.js', '/www/ming8/scripts/test-payment-concurrency.js')
sftp.close()
print('测试脚本已上传')

# 运行测试
cmd = 'cd /www/ming8 && MYSQL_URL="mysql://ming8:Ming8@2026!@localhost:3306/ming8_db" node scripts/test-payment-concurrency.js 2>&1'
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)

output = stdout.read().decode()
errors = stderr.read().decode()

print(output)
if errors:
    print('STDERR:', errors)

ssh.close()
