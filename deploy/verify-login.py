import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

print("等待 10s 让 Next.js 预热...")
time.sleep(10)

def run(title, cmd):
    print(f"\n===== {title} =====")
    _, o, e = ssh.exec_command(cmd)
    out = o.read().decode(errors='replace').strip()
    err = e.read().decode(errors='replace').strip()
    if out:
        print(out)
    if err:
        print("[stderr]", err)

run("1. 模拟登录请求（管理员账号）",
    """curl -s -X POST http://localhost:3001/api/auth/login \
       -H 'Content-Type: application/json' \
       -d '{"email":"282063152@qq.com","password":"admin123"}' 2>&1""")

run("2. 错误密码（应返回 401 用户不存在或密码错误，不是数据库错误）",
    """curl -s -X POST http://localhost:3001/api/auth/login \
       -H 'Content-Type: application/json' \
       -d '{"email":"282063152@qq.com","password":"wrongpassword"}' 2>&1""")

run("3. 公共公告 API",
    "curl -s http://localhost:3001/api/announcement 2>&1")

run("4. 最近 PM2 日志（含 login/数据库/error 关键字）",
    "su - admin -c 'pm2 logs ming8 --lines 30 --nostream' 2>&1 | grep -iE 'login|数据库|error|ER_' | tail -15")

ssh.close()
print("\n===== 验证完成 =====")
