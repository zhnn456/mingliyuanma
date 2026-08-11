"""诊断数据库错误"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASS = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15, look_for_keys=False, allow_agent=False)

cmds = [
    # 1. 检查数据库连接
    "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SELECT 1 as ok;'",
    # 2. 检查所有表
    "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SHOW TABLES;'",
    # 3. 检查 User 表结构
    "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'DESCRIBE User;' 2>&1 | head -30",
    # 4. 检查 User 表数据
    "mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SELECT id, email, name, role, memberLevel FROM User;' 2>&1",
    # 5. 检查 SiteConfig 表
    "mysql -u ming8 -p'Ming8@2026!' ming8_db -e \"SELECT `key`, LEFT(value,80) as val FROM SiteConfig WHERE `key` LIKE 'announcement%';\" 2>&1",
    # 6. 检查 PM2 日志最新错误
    "pm2 logs ming8 --nostream --lines 30 --err 2>&1 | tail -40",
    # 7. 测试 API
    "curl -s http://localhost:3001/api/announcement 2>&1",
    "curl -s http://localhost:3001/api/auth/session 2>&1 | head -5",
]

for cmd in cmds:
    print(f"\n===== {cmd[:80]} =====")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out: print(out)
    if err: print("STDERR:", err)

ssh.close()
