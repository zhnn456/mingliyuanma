import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', look_for_keys=False, allow_agent=False)

# 上传迁移脚本
sftp = ssh.open_sftp()
sftp.put('scripts/mysql-migrate-v5.0-brand-saas.sql', '/www/ming8/scripts/mysql-migrate-v5.0-brand-saas.sql')
sftp.close()

# 执行迁移
stdin, stdout, stderr = ssh.exec_command('mysql -u ming8 -p"Ming8@2026!" ming8_db < /www/ming8/scripts/mysql-migrate-v5.0-brand-saas.sql 2>&1')
print('migrate output:', stdout.read().decode())

# 验证字段
stdin, stdout, stderr = ssh.exec_command('mysql -u ming8 -p"Ming8@2026!" ming8_db -e "DESCRIBE Agent" 2>/dev/null')
result = stdout.read().decode()
for line in result.split('\n'):
    for kw in ['siteName', 'themeColor', 'customerServiceQR', 'contactEmail', 'contactWechat', 'footerText', 'announcement', 'parentAgentId', 'subAgent', 'maxSub']:
        if kw in line:
            print(line)
            break

ssh.close()
print('done')
