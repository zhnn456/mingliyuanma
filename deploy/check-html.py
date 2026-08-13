"""检查服务器上 demo-bazi HTML 文件内容和 prerender-manifest"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618', timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode().strip()

# 检查 demo-bazi.html 文件大小和内容
print('=== demo-bazi.html 文件信息 ===')
print(run('ls -la /www/ming8/.next/server/app/demo-bazi.html'))
print(run('wc -c /www/ming8/.next/server/app/demo-bazi.html'))

# 检查 bazi.html 文件大小对比
print('\n=== bazi.html 文件信息 ===')
print(run('ls -la /www/ming8/.next/server/app/bazi.html'))
print(run('wc -c /www/ming8/.next/server/app/bazi.html'))

# 检查 prerender-manifest.json 中的路由
print('\n=== prerender-manifest.json 中的路由 ===')
print(run('python3 -c "import json; d=json.load(open(\'/www/ming8/.next/prerender-manifest.json\')); routes=list(d.get(\'routes\',{}).keys()); print(\'总路由数:\', len(routes)); print(\'demo-bazi\' in routes); print([r for r in routes if \'demo\' in r or \'bazi\' in r])"'))

# 检查 routes-manifest.json 中的动态路由
print('\n=== routes-manifest.json 中的路由 ===')
print(run('python3 -c "import json; d=json.load(open(\'/www/ming8/.next/routes-manifest.json\')); routes=d.get(\'staticRoutes\',[]); print([r[\'page\'] for r in routes if \'demo\' in r.get(\'page\',\'\') or \'bazi\' in r.get(\'page\',\'\')])"'))

# 检查 app-paths-manifest
print('\n=== app-paths-manifest.json ===')
print(run('python3 -c "import json; d=json.load(open(\'/www/ming8/.next/app-paths-manifest.json\')); print([k for k in d.keys() if \'demo\' in k or \'bazi\' in k])"'))

ssh.close()
