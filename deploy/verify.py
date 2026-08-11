"""部署后验证：PM2 状态 + 日志 + 公告 API + 数据库种子数据"""
import paramiko, sys, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

def run(ssh, cmd):
    print(f"\n>>> {cmd}\n", flush=True)
    _, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    if out: print(out)
    if err: print("[stderr]", err)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

run(ssh, "pm2 list")
run(ssh, "pm2 logs ming8 --lines 25 --nostream")
run(ssh, "curl -s http://localhost:3001/api/announcement")
run(ssh, 'mysql -u ming8 -p"Ming8@2026!" ming8_db -e "SELECT id,title,enabled,sortOrder FROM Announcement ORDER BY sortOrder"')

ssh.close()
