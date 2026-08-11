import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

def run(title, cmd):
    print(f"\n===== {title} =====")
    _, o, e = ssh.exec_command(cmd)
    print(o.read().decode(errors='replace').strip())
    err = e.read().decode(errors='replace').strip()
    if err:
        print("[err]", err)

# 1. Nginx 配置
run("Nginx ming8 配置", "cat /www/server/panel/vhost/nginx/ming8.online.conf 2>/dev/null || find /etc/nginx /www/server -name '*ming8*' 2>/dev/null | head -5")

# 2. .env NEXTAUTH_URL
run(".env 关键变量", "grep -E '^(NEXTAUTH_URL|MYSQL_URL|APP_URL|AGENT)' /www/ming8/.env 2>&1")

# 3. Agent 表的域名字段
run("Agent 表域名信息", "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'SELECT id, brandName, subdomain, customDomain, customDomainExpiry, domain, systemStatus FROM Agent;' 2>&1")

# 4. DNS 解析测试（看 ming8.online 的 A 记录和泛解析）
run("ming8.online DNS 解析", "dig +short ming8.online A 2>&1; echo '---'; dig +short test.ming8.online A 2>&1")

# 5. 当前 Nginx 配置目录
run("Nginx 配置文件列表", "ls -la /www/server/panel/vhost/nginx/ 2>/dev/null | grep -E 'ming8|conf'")

ssh.close()
print("\n===== 完成 =====")
