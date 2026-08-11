"""梳理两个域名的部署情况"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

cmds = [
    ("Nginx所有站点配置", "ls -la /etc/nginx/sites-enabled/ && echo '---' && cat /etc/nginx/sites-enabled/*"),
    ("PM2进程列表", "pm2 list 2>&1 | grep -v '│' | head -5; pm2 list 2>&1 | grep -E 'ming8|ai-nav|name'"),
    ("检查bazi6域名指向", "curl -sI https://bazi6.cc.cd/ 2>&1 | head -10"),
    ("检查ming8域名指向", "curl -sI https://ming8.online/ 2>&1 | head -10"),
    ("bazi6页面标题", "curl -s https://bazi6.cc.cd/ 2>&1 | grep -oP '<title>[^<]+</title>'"),
    ("ming8页面标题", "curl -s https://ming8.online/ 2>&1 | grep -oP '<title>[^<]+</title>'"),
    ("DNS解析bazi6", "dig +short bazi6.cc.cd 2>/dev/null || nslookup bazi6.cc.cd 2>&1 | grep -A2 'Name'"),
    ("DNS解析ming8", "dig +short ming8.online 2>/dev/null || nslookup ming8.online 2>&1 | grep -A2 'Name'"),
    ("服务器IP", "curl -s ifconfig.me 2>/dev/null || hostname -I"),
]

for name, cmd in cmds:
    print(f"\n===== {name} =====")
    _, o, e = ssh.exec_command(cmd)
    print(o.read().decode('utf-8', errors='replace').strip())
    err = e.read().decode('utf-8', errors='replace').strip()
    if err: print("ERR:", err[:300])

ssh.close()
