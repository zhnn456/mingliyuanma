"""检查服务器 BUILD_ID 和客户端 chunk 是否更新"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, _ = ssh.exec_command(cmd, get_pty=True)
    return stdout.read().decode().strip()

# BUILD_ID
print('=== 服务器 BUILD_ID ===')
print(run('cat /www/ming8/standalone/.next/BUILD_ID'))

# 检查 dashboard 页面 chunk 是否包含我修复的代码（"SourceStats"）
print('\n=== 检查 dashboard chunk 是否包含修复代码 ===')
out = run('grep -l "SourceStats" /www/ming8/standalone/.next/server/app/\\(agent\\)/agent/dashboard/page.js 2>/dev/null || echo "NOT FOUND in dashboard page"')
print(out)

# 搜索所有 server chunks 里有没有 SourceStats
print('\n=== 搜索 SourceStats 在所有 chunks ===')
out = run('grep -rl "SourceStats" /www/ming8/standalone/.next/server/ 2>/dev/null | head -5')
print(out if out else 'NOT FOUND')

# 检查前端 client chunk
print('\n=== 检查前端 client chunk ===')
out = run('grep -rl "SourceStats" /www/ming8/standalone/.next/static/chunks/ 2>/dev/null | head -5')
print(out if out else 'NOT FOUND in static chunks')

# 测试 dashboard 页面 HTTP
print('\n=== dashboard 页面 HTTP 状态 ===')
print(run('curl -s -o /dev/null -w "%{http_code}" --max-time 15 http://localhost:3001/agent/dashboard'))

ssh.close()
