import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

print("等待 8s 让 Next.js 预热...")
time.sleep(8)

def run(title, cmd):
    print(f"\n===== {title} =====")
    _, o, e = ssh.exec_command(cmd)
    out = o.read().decode(errors='replace').strip()
    err = e.read().decode(errors='replace').strip()
    if out:
        print(out[:1500])
    if err:
        print("[stderr]", err[:300])

# 1. 登录拿 cookie
run("1. 登录并保存 cookie",
    "curl -s -c /tmp/ming8.cookie -X POST http://localhost:3001/api/auth/login "
    "-H 'Content-Type: application/json' "
    "-d '{\"email\":\"282063152@qq.com\",\"password\":\"admin123\"}'")

# 2. 用 cookie 测试 stats
run("2. /api/admin/stats (修复前是500,修复后应返回200+数据)",
    "curl -s -b /tmp/ming8.cookie -w '\\n[HTTP %{http_code} %{time_total}s]' http://localhost:3001/api/admin/stats")

# 3. 测试公告
run("3. /api/admin/announcement (登录后)",
    "curl -s -b /tmp/ming8.cookie -w '\\n[HTTP %{http_code} %{time_total}s]' http://localhost:3001/api/admin/announcement")

# 4. 清理 cookie
ssh.exec_command("rm -f /tmp/ming8.cookie")

# 5. 看最近错误日志（应无新的 stats 500 错误）
run("4. 最近的 stats 错误日志（应无新增）",
    "su - admin -c 'pm2 logs ming8 --lines 50 --nostream' 2>&1 | grep -iE 'stats|ZiweiRecord|MeihuaRecord|QimenRecord' | tail -10")

ssh.close()
print("\n===== 验证完成 =====")
