"""用正确的 PORT=3001 启动 ming8 并验证"""
import paramiko, sys, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

def run(ssh, cmd, t=120):
    print(f"\n>>> {cmd}\n", flush=True)
    _, stdout, stderr = ssh.exec_command(cmd, timeout=t)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    if out: print(out)
    if err: print("[stderr]", err)
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

# 1. 删除 errored 进程
run(ssh, "pm2 delete ming8 2>&1 || true")

# 2. 用 PORT=3001 启动
run(ssh, "cd /www/ming8 && PORT=3001 pm2 start npm --name ming8 -- start 2>&1")

# 3. 保存
run(ssh, "pm2 save 2>&1")

# 4. 等待启动
print("\n等待 10 秒让应用启动...")
time.sleep(10)

# 5. 状态
run(ssh, "pm2 list")

# 6. 日志
run(ssh, "pm2 logs ming8 --lines 15 --nostream 2>&1")

# 7. 公告 API（应为新格式 announcements 复数）
print("\n===== 验证公告 API（新格式 announcements）=====")
run(ssh, "curl -s http://localhost:3001/api/announcement")

# 8. 数据库种子数据
print("\n===== 验证 Announcement 表种子数据 =====")
run(ssh, 'mysql -u ming8 -p"Ming8@2026!" ming8_db -e "SELECT id,title,enabled,sortOrder FROM Announcement ORDER BY sortOrder" 2>&1')

# 9. 健康检查
run(ssh, "curl -s http://localhost:3001/api/health")

ssh.close()
print("\n✅ 完成")
