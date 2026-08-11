import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

def run(title, cmd):
    print(f"\n===== {title} =====")
    _, o, e = ssh.exec_command(cmd)
    out = o.read().decode(errors='replace').strip()
    err = e.read().decode(errors='replace').strip()
    if out:
        print(out[:1200])
    if err:
        print("[err]", err[:300])

# 重启 PM2
run("重启 PM2 ming8", "su - admin -c 'pm2 restart ming8' 2>&1")
time.sleep(6)

# 登录拿 cookie（用原管理员账号）
run("登录", "curl -s -c /tmp/m8.cookie -X POST http://localhost:3001/api/auth/login "
    "-H 'Content-Type: application/json' "
    "-d '{\"email\":\"282063152@qq.com\",\"password\":\"admin123\"}'")

# 测试关键 API
run("1. /api/admin/stats (后台首页统计)",
    "curl -s -b /tmp/m8.cookie -w '\\n[HTTP %{http_code}]' http://localhost:3001/api/admin/stats")

run("2. /api/admin/agents (代理商列表,应3条)",
    "curl -s -b /tmp/m8.cookie -w '\\n[HTTP %{http_code}]' http://localhost:3001/api/admin/agents")

run("3. /api/admin/users (用户列表,应10条)",
    "curl -s -b /tmp/m8.cookie -w '\\n[HTTP %{http_code}]' http://localhost:3001/api/admin/users")

run("4. /api/admin/orders (订单列表,应11条)",
    "curl -s -b /tmp/m8.cookie -w '\\n[HTTP %{http_code}]' http://localhost:3001/api/admin/orders")

run("5. /api/admin/records (排盘记录)",
    "curl -s -b /tmp/m8.cookie -w '\\n[HTTP %{http_code}]' http://localhost:3001/api/admin/records")

ssh.exec_command("rm -f /tmp/m8.cookie")
ssh.close()
print("\n===== 验证完成 =====")
