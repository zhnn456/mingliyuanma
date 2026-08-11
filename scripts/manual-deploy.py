"""检查服务器状态并手动部署"""
import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

def run(ssh, cmd, timeout=120):
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode(errors='replace').strip(), stderr.read().decode(errors='replace').strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

# 1. 检查服务器代码版本
print("=== 1. 服务器 git 状态 ===")
out, _ = run(ssh, 'cd /www/ming8 && git log --oneline -3')
print(out)

# 2. 检查 card-key.ts 中 CODE_LENGTH
print("\n=== 2. 服务器 card-key.ts CODE_LENGTH ===")
out, _ = run(ssh, "cd /www/ming8 && grep 'CODE_LENGTH' src/lib/card-key.ts")
print(out)

# 3. 手动拉取代码并重新构建
print("\n=== 3. 手动部署 ===")
out, err = run(ssh, 'cd /www/ming8 && git pull origin main 2>&1')
print("git pull:", out)

# 4. 重新构建
print("\n=== 4. 构建 ===")
out, err = run(ssh, 'cd /www/ming8 && npm run build 2>&1', timeout=180)
# 只显示最后几行
lines = out.split('\n')
print('\n'.join(lines[-10:]))

# 5. 重启 PM2
print("\n=== 5. 重启 PM2 ===")
out, _ = run(ssh, 'pm2 restart ming8 2>&1')
print(out)
time.sleep(5)

# 6. 验证健康检查
print("\n=== 6. 验证 ===")
out, _ = run(ssh, 'curl -s http://localhost:3001/api/health')
print(out)

# 7. 再次检查 CODE_LENGTH
print("\n=== 7. 验证编译后代码 ===")
out, _ = run(ssh, "grep -r 'CODE_LENGTH' /www/ming8/.next/server/ 2>/dev/null | head -3")
print(out)

ssh.close()
