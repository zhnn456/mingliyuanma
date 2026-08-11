"""查询版本管理相关数据库状态"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

cmds = [
    ('UpdateLog 表是否存在', "mysql -u ming8 -p'Ming8@2026!' ming8_db -e \"SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='ming8_db' AND TABLE_NAME='UpdateLog'\" 2>&1 | grep -v Warning"),
    ('UpdateLog 表结构', "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'DESCRIBE UpdateLog' 2>&1 | grep -v Warning"),
    ('UpdateLog 记录数', "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SELECT COUNT(*) as total FROM UpdateLog' 2>&1 | grep -v Warning"),
    ('最近5条记录', "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SELECT id,version,title,type,status,createdAt FROM UpdateLog ORDER BY createdAt DESC LIMIT 5' 2>&1 | grep -v Warning"),
    ('当前版本(从代码)', "curl -s http://localhost:3001/api/health"),
]
for name, cmd in cmds:
    print(f"\n===== {name} =====")
    _, stdout, _ = ssh.exec_command(cmd)
    print(stdout.read().decode(errors='replace'))

ssh.close()
