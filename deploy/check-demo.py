"""检查服务器上 demo-bazi 文件是否存在"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip()

# 检查 demo-bazi HTML 文件
print('=== /www/ming8/.next/server/app/demo-bazi/ ===')
print(run('ls -la /www/ming8/.next/server/app/demo-bazi/ 2>/dev/null || echo "not found"'))

# 检查 (public) 目录
print('\n=== /www/ming8/.next/server/app/(public)/demo-bazi/ ===')
print(run('ls -la "/www/ming8/.next/server/app/(public)/demo-bazi/" 2>/dev/null || echo "not found"'))

# 搜索所有 demo 相关文件
print('\n=== 搜索 demo 相关 HTML ===')
print(run('find /www/ming8/.next/server/app -name "*demo*" -type f 2>/dev/null || echo "none"'))

# 检查本地文件
import os
local_path = r'f:\mingliyuanma\.next\server\app\demo-bazi'
if os.path.exists(local_path):
    print(f'\n本地存在: {local_path}')
    print(os.listdir(local_path))
else:
    # 检查 (public) 路径
    local_path2 = r'f:\mingliyuanma\.next\server\app\(public)\demo-bazi'
    if os.path.exists(local_path2):
        print(f'\n本地存在: {local_path2}')
        print(os.listdir(local_path2))
    else:
        print('\n本地也不存在 demo-bazi 目录')

# 检查 standalone 目录
print('\n=== standalone 目录 ===')
std_path = r'f:\mingliyuanma\.next\standalone\.next\server\app\demo-bazi'
if os.path.exists(std_path):
    print(f'standalone 存在: {std_path}')
    print(os.listdir(std_path))
else:
    std_path2 = r'f:\mingliyuanma\.next\standalone\.next\server\app\(public)\demo-bazi'
    if os.path.exists(std_path2):
        print(f'standalone (public) 存在: {std_path2}')
        print(os.listdir(std_path2))
    else:
        print('standalone 也不存在')

ssh.close()
