"""验证版本管理 API 修复结果"""
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

cmds = [
    ('health API(看gitCommit)', "curl -s http://localhost:3001/api/health"),
    ('updates API(应403非500)', "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/admin/updates"),
    ('update-logs API(应403非500)', "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/admin/update-logs"),
    ('version/release API(应403非500)', "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/version/release"),
    ('Version 表数据', "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SELECT id,version,title,isLatest FROM Version' 2>&1 | grep -v Warning"),
]
for name, cmd in cmds:
    print(f"\n===== {name} =====")
    _, stdout, _ = ssh.exec_command(cmd)
    print(stdout.read().decode(errors='replace'))

ssh.close()
