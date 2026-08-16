"""查询所有后台账号（admin/demo/editor/agent 角色）"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618',
            look_for_keys=False, allow_agent=False)

cmd = '''mysql -u ming8 -p"Ming8@2026!" ming8_db --default-character-set=utf8mb4 -e "SELECT id,email,name,role,memberLevel,createdAt FROM User WHERE role IN ('admin','demo','editor','agent') ORDER BY role,createdAt" 2>&1'''

stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print(out)
if err and 'Warning' not in err:
    print('STDERR:', err)
ssh.close()
