import paramiko, time, sys

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)
print("SSH 连接成功")

# 确保内存策略
print("\n调整内存策略...")
_, o, _ = ssh.exec_command('sysctl -w vm.swappiness=100 && echo OK')
print(o.read().decode())

# 构建命令：512MB 限制 + overcommit 已开启
cmd = 'cd /www/ming8 && NODE_OPTIONS="--max-old-space-size=512" npm run build 2>&1'
print(f"\n>>> {cmd}\n")

transport = ssh.get_transport()
transport.set_keepalive(15)
channel = transport.open_session()
channel.settimeout(600)
channel.exec_command(cmd)

while not channel.exit_status_ready():
    if channel.recv_ready():
        data = channel.recv(4096).decode(errors='replace')
        print(data, end='', flush=True)
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
    if exit_code == 137:
        print("OOM: 内存不足，需要上传本地构建产物")
    _, o, _ = ssh.exec_command('dmesg | grep -i "killed process" | tail -3')
    print(o.read().decode())

ssh.close()
