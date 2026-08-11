import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

def run(title, cmd):
    print(f"\n===== {title} =====")
    _, o, e = ssh.exec_command(cmd)
    print(o.read().decode(errors='replace').strip())

run("Nginx ming8 配置完整内容", "cat /etc/nginx/sites-available/ming8 2>&1")
run("Nginx 是否有通配符配置", "grep -r 'server_name' /etc/nginx/sites-enabled/ 2>&1")
run("SSL 证书状态", "ls -la /www/server/panel/vhost/cert/ 2>/dev/null; ls -la /etc/letsencrypt/live/ 2>/dev/null | head -10")
run("ming8.online SSL 证书", "openssl x509 -in /etc/letsencrypt/live/ming8.online/fullchain.pem -noout -subject -ext subjectAltName 2>&1 | head -5")

ssh.close()
