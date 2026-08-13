"""检查访问 demo-bazi 时的 PM2 错误日志"""
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip() + stderr.read().decode().strip()

# 清除旧日志
run('su - admin -c "pm2 flush ming8" 2>&1')

# 触发一次 demo-bazi 请求
print('=== 触发 demo-bazi 请求 ===')
run('curl -s http://localhost:3001/demo-bazi > /dev/null 2>&1')

time.sleep(2)

# 查看错误日志
print('=== PM2 错误日志 ===')
print(run('su - admin -c "pm2 logs ming8 --lines 20 --nostream" 2>&1')[-1000:])

# 检查 page.js.nft.json
print('\n=== page.js.nft.json 内容 ===')
print(run('cat "/www/ming8/.next/server/app/(public)/demo-bazi/page.js.nft.json" 2>/dev/null | head -5'))

# 检查 demo 页面的 nft.json 对比
print('\n=== demo page nft.json ===')
print(run('cat "/www/ming8/.next/server/app/(public)/demo/page.js.nft.json" 2>/dev/null | head -5'))

ssh.close()
