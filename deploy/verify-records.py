import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

print("等待 6s 让 Next.js 预热...")
time.sleep(6)

def run(title, cmd):
    print(f"\n===== {title} =====")
    _, o, e = ssh.exec_command(cmd)
    out = o.read().decode(errors='replace').strip()
    err = e.read().decode(errors='replace').strip()
    if out:
        print(out[:1500])
    if err:
        print("[stderr]", err[:300])

# 登录拿 cookie
run("1. 登录",
    "curl -s -c /tmp/m8.cookie -X POST http://localhost:3001/api/auth/login "
    "-H 'Content-Type: application/json' "
    "-d '{\"email\":\"282063152@qq.com\",\"password\":\"admin123\"}'")

# 排盘记录 API（修复前 500，修复后应 200）
run("2. /api/admin/records (排盘记录,修复前500)",
    "curl -s -b /tmp/m8.cookie -w '\\n[HTTP %{http_code} %{time_total}s]' http://localhost:3001/api/admin/records")

# 指定 type=ziwei
run("3. /api/admin/records?type=ziwei (紫微,表不存在应返回空不报错)",
    "curl -s -b /tmp/m8.cookie -w '\\n[HTTP %{http_code} %{time_total}s]' 'http://localhost:3001/api/admin/records?type=ziwei'")

# 看部署后新日志（按时间过滤，只看最近 2 分钟）
run("4. 部署后最近日志（应无 ZiweiRecord 新错误）",
    "su - admin -c 'pm2 logs ming8 --lines 30 --nostream' 2>&1 | grep -iE 'ZiweiRecord|MeihuaRecord|QimenRecord|获取排盘|获取统计' | tail -10")

ssh.exec_command("rm -f /tmp/m8.cookie")
ssh.close()
print("\n===== 验证完成 =====")
