"""精简数据库诊断"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

cmds = [
    ("数据库连接", "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SELECT 1;' 2>&1 | grep -v 'Using a password'"),
    ("表列表", "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SHOW TABLES;' 2>&1 | grep -v 'Using a password'"),
    ("User表数据", "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SELECT id,email,name,role FROM User;' 2>&1 | grep -v 'Using a password'"),
    ("公告配置", "mysql -u ming8 -p'Ming8@2026!' ming8_db -e \"SELECT `key`,LEFT(value,60) FROM SiteConfig WHERE `key` LIKE 'announcement%';\" 2>&1 | grep -v 'Using a password'"),
    ("API公告", "curl -s http://localhost:3001/api/announcement"),
    ("PM2错误", "pm2 logs ming8 --nostream --lines 15 --err 2>&1 | tail -20"),
]

for name, cmd in cmds:
    print(f"\n===== {name} =====")
    _, o, _ = ssh.exec_command(cmd)
    print(o.read().decode('utf-8', errors='replace').strip())

ssh.close()
