import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)
print("SSH 连接成功")

# 安装 certbot
print("\n===== 安装 certbot =====")
transport = ssh.get_transport()
transport.set_keepalive(15)
channel = transport.open_session()
channel.settimeout(120)
channel.exec_command('apt update -qq && apt install -y certbot python3-certbot-nginx 2>&1')
while not channel.exit_status_ready():
    if channel.recv_ready():
        print(channel.recv(4096).decode(errors='replace'), end='', flush=True)
    time.sleep(0.3)
print(f"\n[安装退出码: {channel.recv_exit_status()}]")

# 申请证书
print("\n===== 申请 Let's Encrypt 证书 =====")
cmd = 'certbot --nginx -d ming8.online -d www.ming8.online --non-interactive --agree-tos -m admin@ming8.online --redirect 2>&1'
print(f">>> {cmd}\n")
channel2 = transport.open_session()
channel2.settimeout(120)
channel2.exec_command(cmd)
while not channel2.exit_status_ready():
    if channel2.recv_ready():
        print(channel2.recv(4096).decode(errors='replace'), end='', flush=True)
    time.sleep(0.3)
print(f"\n[证书申请退出码: {channel2.recv_exit_status()}]")

# 验证 HTTPS
print("\n===== 验证 HTTPS =====")
_, o, _ = ssh.exec_command('curl -sI https://ming8.online 2>&1 | head -5')
print(o.read().decode())

_, o, _ = ssh.exec_command('nginx -t 2>&1')
print("Nginx 配置检查:", o.read().decode())

ssh.close()
print("===== SSL 配置完成 =====")
