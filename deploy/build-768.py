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
_, o, _ = ssh.exec_command('echo 3 > /proc/sys/vm/drop_caches; sysctl -w vm.swappiness=100')
o.read()

# 构建：oom_score_adj=-1000 防止被杀 + 768MB 堆
cmd = """cd /www/ming8 && bash -c 'echo -1000 > /proc/self/oom_score_adj && exec env NODE_OPTIONS="--max-old-space-size=768" npm run build' 2>&1"""
print(f"\n>>> 构建 (768MB + anti-OOM)\n")

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

if exit_code == 0:
    print("\n✅ 构建成功！启动服务...")
    _, o, _ = ssh.exec_command('su - admin -c "cd /www/ming8 && pm2 start deploy/ecosystem.config.js" 2>&1 || su - admin -c "pm2 restart ming8" 2>&1')
    print(o.read().decode())
    time.sleep(1)
    _, o, _ = ssh.exec_command('su - admin -c "pm2 save" 2>&1')
    time.sleep(5)
    _, o, _ = ssh.exec_command('curl -s -o /dev/null -w "HTTP状态码: %{http_code}\\n" http://localhost:3001')
    print(o.read().decode())
    _, o, _ = ssh.exec_command('su - admin -c "pm2 status" 2>/dev/null')
    print(o.read().decode())
else:
    print(f"\n❌ 构建失败 (退出码 {exit_code})")
    _, o, _ = ssh.exec_command('dmesg | grep -i "killed" | tail -3')
    print(o.read().decode())

ssh.close()
