"""检查 Version 表是否存在"""
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)
_, stdout, _ = ssh.exec_command("mysql -u ming8 -p'Ming8@2026!' ming8_db -e \"SHOW TABLES LIKE 'Version'\" 2>&1 | grep -v Warning")
print("Version 表:", stdout.read().decode(errors='replace') or "不存在")
_, stdout, _ = ssh.exec_command("mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SHOW TABLES' 2>&1 | grep -v Warning | grep -i version")
print("含 version 的表:", stdout.read().decode(errors='replace') or "无")
ssh.close()
