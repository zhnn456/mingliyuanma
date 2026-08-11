import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

def run(title, cmd):
    print(f"\n===== {title} =====")
    _, o, e = ssh.exec_command(cmd)
    out = o.read().decode(errors='replace').strip()
    err = e.read().decode(errors='replace').strip()
    if out:
        print(out)
    if err:
        print("[stderr]", err)

# 最近 200 行 PM2 日志中的错误（按时间倒序）
run("PM2 ming8 最近错误日志（按 ER_/error/login/失败 过滤）",
    "su - admin -c 'pm2 logs ming8 --lines 300 --nostream' 2>&1 | grep -iE 'ER_|error|失败|500|login|admin' | tail -60")

# 测试管理后台几个关键 API
run("测试 /api/admin/announcement (需要token，会401或200)",
    "curl -s -o /dev/null -w '%{http_code} %{time_total}s' http://localhost:3001/api/admin/announcement")

run("测试 /api/admin/config",
    "curl -s -o /dev/null -w '%{http_code} %{time_total}s' http://localhost:3001/api/admin/config")

run("测试 /api/admin/users",
    "curl -s -o /dev/null -w '%{http_code} %{time_total}s' http://localhost:3001/api/admin/users")

run("测试 /api/admin/orders",
    "curl -s -o /dev/null -w '%{http_code} %{time_total}s' http://localhost:3001/api/admin/orders")

run("测试 /api/admin/dashboard",
    "curl -s -o /dev/null -w '%{http_code} %{time_total}s' http://localhost:3001/api/admin/dashboard")

run("测试 /api/auth/me",
    "curl -s -o /dev/null -w '%{http_code} %{time_total}s' http://localhost:3001/api/auth/me")

# 看 admin 路径调用的 API 列表（从代码里找）
run("admin 首页加载链路",
    "curl -s -o /dev/null -w '%{http_code} %{time_total}s' http://localhost:3001/admin")

ssh.close()
print("\n===== 诊断完成 =====")
