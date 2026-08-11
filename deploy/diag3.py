"""测试登录和管理后台"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

cmds = [
    ("测试登录API", """curl -s -X POST http://localhost:3001/api/auth/callback/credentials \
      -H 'Content-Type: application/x-www-form-urlencoded' \
      -d 'email=282063152@qq.com&password=admin123&csrfToken=test&callbackUrl=http://localhost:3001/admin' 2>&1 | head -5"""),
    ("PM2最新日志", "pm2 logs ming8 --nostream --lines 40 --out 2>&1 | tail -30"),
    ("测试admin公告API", "curl -s http://localhost:3001/api/admin/announcement 2>&1"),
    ("公告配置查询", """mysql -u ming8 -p'Ming8@2026!' ming8_db -e 'SELECT `key`, LEFT(value,80) as val FROM SiteConfig WHERE `key` LIKE "announcement%";' 2>&1 | grep -v 'Using a password'"""),
]

for name, cmd in cmds:
    print(f"\n===== {name} =====")
    _, o, e = ssh.exec_command(cmd)
    print(o.read().decode('utf-8', errors='replace').strip())
    err = e.read().decode('utf-8', errors='replace').strip()
    if err: print("ERR:", err[:200])

ssh.close()
