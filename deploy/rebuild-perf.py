import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)
print("SSH 连接成功")

# 释放内存 + 设置策略
print("释放缓存...")
_, o, _ = ssh.exec_command('echo 3 > /proc/sys/vm/drop_caches; sysctl -w vm.swappiness=10')
o.read()

# git pull
print("\n拉取代码...")
_, o, _ = ssh.exec_command('su - admin -c "cd /www/ming8 && git pull origin main" 2>&1')
print(o.read().decode().strip())

# 执行数据库初始化（添加 OfferingCategory 表 + 种子数据）
print("\n初始化数据库...")
_, o, _ = ssh.exec_command("mysql -u ming8 -p'Ming8@2026!' ming8_db < /www/ming8/scripts/mysql-init.sql 2>&1 | grep -v 'Using a password' | tail -3")
print(o.read().decode().strip())

# 构建：768MB + anti-OOM
print("\n构建（768MB + anti-OOM）...")
cmd = """cd /www/ming8 && bash -c 'echo -1000 > /proc/self/oom_score_adj && exec env NODE_OPTIONS="--max-old-space-size=768" npm run build' 2>&1"""
print(f">>> {cmd}\n")

transport = ssh.get_transport()
transport.set_keepalive(15)
channel = transport.open_session()
channel.settimeout(600)
channel.exec_command(cmd)
while not channel.exit_status_ready():
    if channel.recv_ready():
        print(channel.recv(4096).decode(errors='replace'), end='', flush=True)
    time.sleep(0.3)
exit_code = channel.recv_exit_status()
print(f"\n[退出码: {exit_code}]")

if exit_code != 0:
    print("❌ 构建失败")
    ssh.close()
    exit(1)

# 重启 ming8
print("\n重启 ming8...")
_, o, _ = ssh.exec_command('su - admin -c "pm2 restart ming8" 2>&1')
print(o.read().decode().strip())
time.sleep(8)

# 速度测试
print("\n===== 速度测试 =====")
for p in ['/', '/login', '/api/health']:
    _, o, _ = ssh.exec_command(f'curl -s -o /dev/null -w "%{{http_code}} %{{time_total}}s" http://localhost:3001{p}')
    print(f"  {p:20s} => {o.read().decode().strip()}")

ssh.close()
print("\n===== 完成 =====")
