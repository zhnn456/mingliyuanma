import paramiko, time, sys

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

def run_stream(ssh, cmd, timeout=600):
    """执行长时间命令，实时读取输出"""
    print(f"\n>>> {cmd}\n")
    transport = ssh.get_transport()
    transport.set_keepalive(30)
    channel = transport.open_session()
    channel.settimeout(timeout)
    channel.exec_command(cmd)
    output = ""
    while not channel.exit_status_ready():
        if channel.recv_ready():
            data = channel.recv(4096).decode(errors='replace')
            output += data
            print(data, end='', flush=True)
        if channel.recv_stderr_ready():
            data = channel.recv_stderr(4096).decode(errors='replace')
            print(data, end='', flush=True)
        time.sleep(0.3)
    exit_code = channel.recv_exit_status()
    print(f"\n[退出码: {exit_code}]")
    return exit_code, output

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)
print("SSH 连接成功")

# 构建（ming8 已停、git pull 和 mysql init 已完成）
print("\n===== 在服务器上构建（限制内存 1GB）=====")
exit_code, _ = run_stream(ssh, 'cd /www/ming8 && NODE_OPTIONS="--max-old-space-size=1024" npm run build 2>&1')

if exit_code != 0:
    print("\n❌ 构建失败！")
    # 检查是否 OOM
    _, mem_out = ssh.exec_command('dmesg | grep -i "killed process" | tail -3')
    print("OOM 检查:", mem_out.read().decode())
    ssh.close()
    sys.exit(1)

print("\n===== 构建成功！启动服务 =====")
ssh.exec_command('su - admin -c "cd /www/ming8 && pm2 start deploy/ecosystem.config.js" 2>/dev/null')
time.sleep(1)
ssh.exec_command('su - admin -c "pm2 restart ming8" 2>/dev/null')
time.sleep(1)
ssh.exec_command('su - admin -c "pm2 save" 2>/dev/null')

time.sleep(5)
print("\n===== 验证 =====")
_, o, _ = ssh.exec_command('curl -s -o /dev/null -w "HTTP状态码: %{http_code}\\n" http://localhost:3001')
print(o.read().decode())

_, o, _ = ssh.exec_command('su - admin -c "pm2 status" 2>/dev/null')
print(o.read().decode())

_, o, _ = ssh.exec_command('free -h')
print(o.read().decode())

ssh.close()
print("===== 部署完成 =====")
