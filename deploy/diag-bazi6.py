"""检查bazi6部署方式"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

cmds = [
    ("bazi6完整响应头", "curl -sI https://bazi6.cc.cd/ 2>&1"),
    ("bazi6是否有CF-Pages头", "curl -sI https://bazi6.cc.cd/ 2>&1 | grep -i 'cf-\\|pages\\|worker'"),
    ("服务器是否有bazi6的Nginx配置", "grep -r 'bazi6' /etc/nginx/ 2>&1 || echo 'Nginx无bazi6配置'"),
    ("ming8响应头确认", "curl -sI https://ming8.online/ 2>&1 | head -15"),
]

for name, cmd in cmds:
    print(f"\n===== {name} =====")
    _, o, _ = ssh.exec_command(cmd)
    print(o.read().decode('utf-8', errors='replace').strip())

ssh.close()
