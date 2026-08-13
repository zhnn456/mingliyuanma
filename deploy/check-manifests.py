"""检查服务器上路由清单是否包含 demo-bazi"""
import paramiko
import json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip()

# 检查 routes-manifest.json 是否包含 demo-bazi
print('=== routes-manifest.json 中是否包含 demo-bazi ===')
routes = run('grep -c "demo-bazi" /www/ming8/.next/routes-manifest.json 2>/dev/null || echo 0')
print(f'匹配数: {routes}')

# 检查 prerender-manifest.json
print('\n=== prerender-manifest.json 中是否包含 demo-bazi ===')
prerender = run('grep -c "demo-bazi" /www/ming8/.next/prerender-manifest.json 2>/dev/null || echo 0')
print(f'匹配数: {prerender}')

# 检查文件修改时间
print('\n=== routes-manifest.json 修改时间 ===')
print(run('ls -la /www/ming8/.next/routes-manifest.json'))

print('\n=== prerender-manifest.json 修改时间 ===')
print(run('ls -la /www/ming8/.next/prerender-manifest.json'))

# 检查本地这两个文件是否包含 demo-bazi
import os
local_routes = r'f:\mingliyuanma\.next\standalone\.next\routes-manifest.json'
local_prerender = r'f:\mingliyuanma\.next\standalone\.next\prerender-manifest.json'

if os.path.exists(local_routes):
    with open(local_routes, 'r', encoding='utf-8') as f:
        content = f.read()
    print(f'\n本地 routes-manifest.json 包含 demo-bazi: {"demo-bazi" in content}')

if os.path.exists(local_prerender):
    with open(local_prerender, 'r', encoding='utf-8') as f:
        content = f.read()
    print(f'本地 prerender-manifest.json 包含 demo-bazi: {"demo-bazi" in content}')

# 检查 required-server-files.json
print('\n=== required-server-files.json 修改时间 ===')
print(run('ls -la /www/ming8/.next/required-server-files.json'))

ssh.close()
