"""直接上传 app-paths-manifest.json 到服务器"""
import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=20, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip() + stderr.read().decode().strip()

# 1. 检查服务器上当前的 app-paths-manifest.json
print('=== 服务器上 app-paths-manifest.json 是否包含 demo-bazi ===')
result = run('grep -c "demo-bazi" /www/ming8/.next/server/app-paths-manifest.json 2>/dev/null || echo 0')
print(f'匹配数: {result}')

# 2. 上传本地的 app-paths-manifest.json
sftp = ssh.open_sftp()
local_file = r'f:\mingliyuanma\.next\standalone\.next\server\app-paths-manifest.json'
remote_file = '/www/ming8/.next/server/app-paths-manifest.json'

print(f'\n=== 上传 app-paths-manifest.json ===')
sftp.put(local_file, remote_file)
print('上传完成')

# 3. 同时上传所有 manifest 文件
manifests = [
    ('routes-manifest.json', '/www/ming8/.next/routes-manifest.json'),
    ('prerender-manifest.json', '/www/ming8/.next/prerender-manifest.json'),
]

for local_name, remote_path in manifests:
    local_path = rf'f:\mingliyuanma\.next\standalone\.next\{local_name}'
    print(f'上传 {local_name}...')
    sftp.put(local_path, remote_path)

sftp.close()

# 4. 重启 PM2
print('\n=== 重启 PM2 ===')
print(run('su - admin -c "pm2 restart ming8" 2>&1')[:200])

time.sleep(8)

# 5. 测试
print('\n=== 测试 ===')
print('demo-bazi:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/demo-bazi'))
print('bazi:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/bazi'))
print('首页:', run('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/'))

# 6. 外部测试
print('\n=== 外部测试 ===')
print('demo-bazi:', run('curl -s -o /dev/null -w "%{http_code}" https://ming8.online/demo-bazi'))

ssh.close()
