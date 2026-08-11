"""重启 ming8 PM2 进程并验证"""
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

# 1. 杀掉占用 3001 的残留进程
run(ssh, "fuser -k 3001/tcp 2>/dev/null; sleep 2; echo '端口已释放'")

# 2. 启动 ming8
run(ssh, "cd /www/ming8 && pm2 start npm --name ming8 -- start 2>&1")

# 3. 保存进程列表
run(ssh, "pm2 save 2>&1")

# 4. 等待启动
print("\n等待 8 秒让应用启动...")
time.sleep(8)

# 5. 查看进程状态
run(ssh, "pm2 list")

# 6. 查看日志
run(ssh, "pm2 logs ming8 --lines 30 --nostream")

# 7. 验证公告 API（新格式 announcements 复数）
run(ssh, "curl -s http://localhost:3001/api/announcement")

# 8. 查询数据库种子数据
run(ssh, 'mysql -u ming8 -p"Ming8@2026!" ming8_db -e "SELECT id,title,enabled,sortOrder FROM Announcement ORDER BY sortOrder" 2>&1')

ssh.close()
print("\n✅ 完成")
