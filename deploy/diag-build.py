"""诊断构建失败原因"""
import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

# 1. 单独测试 version-inject.js
print("===== 1. 测试 version-inject.js =====")
_, stdout, stderr = ssh.exec_command('cd /www/ming8 && node scripts/version-inject.js 2>&1')
print(stdout.read().decode(errors='replace'))

# 2. 检查 version.ts 是否被注入
print("\n===== 2. version.ts 内容（前16行）=====")
_, stdout, _ = ssh.exec_command('head -16 /www/ming8/src/lib/version.ts')
print(stdout.read().decode(errors='replace'))

# 3. 执行完整构建看错误（tail -80）
print("\n===== 3. 构建输出（tail -80）=====")
_, stdout, _ = ssh.exec_command('cd /www/ming8 && NODE_OPTIONS="--max-old-space-size=1024" npm run build:server 2>&1 | tail -80', timeout=300)
print(stdout.read().decode(errors='replace'))

ssh.close()
