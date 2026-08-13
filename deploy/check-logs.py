"""检查 PM2 日志和直接 curl 测试"""
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out, err

# 查看 PM2 日志最近的错误
out, _ = run('su - admin -c "pm2 logs ming8 --lines 30 --nostream" 2>&1')
print('=== PM2 日志 ===')
print(out[-1500:])

# 直接 curl 测试 demo-bazi，看返回内容
out, _ = run('curl -s http://localhost:3001/demo-bazi 2>&1 | head -5')
print('\n=== curl demo-bazi 返回内容 ===')
print(out[:500])

# 检查 next start 命令
out, _ = run('su - admin -c "pm2 show ming8" 2>&1 | grep -E "script|exec|cwd|args"')
print('\n=== PM2 配置 ===')
print(out)

# 检查 /www/ming8 目录结构
out, _ = run('ls /www/ming8/.next/server/app/ | head -20')
print('\n=== .next/server/app/ 目录 ===')
print(out)

ssh.close()
