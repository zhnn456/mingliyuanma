"""查 admin@test.com 的 passwordHash 和 demo 账号的 hash"""
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', look_for_keys=False, allow_agent=False)
cmd = '''mysql -u ming8 -p"Ming8@2026!" ming8_db --default-character-set=utf8mb4 -e "SELECT email, LEFT(passwordHash, 30) as hash_prefix, LENGTH(passwordHash) as hash_len FROM User WHERE email IN ('admin@test.com','demo@ming8.online','282063152@qq.com')" 2>&1'''
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
