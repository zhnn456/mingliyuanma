import paramiko, time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)
print("连接成功，优化性能...")

# 1. 降低 swappiness（减少 swap 使用）
_, o, _ = ssh.exec_command('sysctl -w vm.swappiness=10')
print("swappiness:", o.read().decode().strip())

# 2. 永久生效
_, o, _ = ssh.exec_command('grep -q swappiness /etc/sysctl.conf && sed -i "s/vm.swappiness=.*/vm.swappiness=10/" /etc/sysctl.conf || echo "vm.swappiness=10" >> /etc/sysctl.conf')
o.read()

# 3. 重启 ming8（清理内存碎片，释放 456MB）
print("\n重启 ming8...")
_, o, _ = ssh.exec_command('su - admin -c "pm2 restart ming8" 2>&1')
print(o.read().decode().strip())

# 4. 等待稳定
time.sleep(10)

# 5. 检查结果
print("\n===== 优化后状态 =====")
_, o, _ = ssh.exec_command('free -h')
print(o.read().decode())

_, o, _ = ssh.exec_command('su - admin -c "pm2 status" 2>/dev/null')
print(o.read().decode())

_, o, _ = ssh.exec_command('cat /proc/sys/vm/swappiness')
print("swappiness:", o.read().decode().strip())

# 6. 测试响应速度
print("\n===== 响应速度测试 =====")
_, o, _ = ssh.exec_command('curl -s -o /dev/null -w "HTTP状态: %{http_code} | 总耗时: %{time_total}s | TTFB: %{time_starttransfer}s\\n" http://localhost:3001')
print(o.read().decode())

ssh.close()
print("===== 优化完成 =====")
