"""诊断版本管理 500 错误"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

cmds = [
    ('UpdateLog 表结构(是否有新字段)', "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'DESCRIBE UpdateLog' 2>&1 | grep -v Warning"),
    ('pm2 日志(最近50行)', "pm2 logs ming8 --lines 50 --nostream 2>&1 | grep -iE 'error|500|UpdateLog|update-log|updates' | tail -30"),
    ('直接查 updates API SQL', "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SELECT id,version,title,category,isCurrent,isLatest FROM UpdateLog LIMIT 3' 2>&1 | grep -v Warning"),
    ('health API', "curl -s http://localhost:3001/api/health"),
]
for name, cmd in cmds:
    print(f"\n===== {name} =====")
    _, stdout, _ = ssh.exec_command(cmd)
    print(stdout.read().decode(errors='replace'))

ssh.close()
