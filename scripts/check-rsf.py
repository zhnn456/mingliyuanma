"""检查 required-server-files.json"""
import paramiko, sys, json
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace'), stderr.read().decode('utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.79.3.189', username='root', password='Aa20260618', look_for_keys=False, allow_agent=False, banner_timeout=60, timeout=30)

# 1. 检查 required-server-files.json
print('=== 1. required-server-files.json ===')
out, _ = run(ssh, 'cat /www/ming8/.next/server/required-server-files.json 2>/dev/null | head -c 500')
print(f'  {out[:300]}')

# 2. 检查是否包含 apply-upgrade
out, _ = run(ssh, 'grep "apply-upgrade" /www/ming8/.next/server/required-server-files.json 2>/dev/null || echo "NOT FOUND"')
print(f'\n  apply-upgrade in rsf: {out.strip()[:80]}')

# 3. 检查 server.js 中的路由配置
print('\n=== 2. server.js 路由 ===')
out, _ = run(ssh, 'grep -c "app-paths-manifest" /www/ming8/server.js')
print(f'  app-paths-manifest 引用数: {out.strip()}')

# 4. 检查 server.js 中的路径
out, _ = run(ssh, 'grep -oP "require\\([^)]+\\)" /www/ming8/server.js | head -5')
print(f'  require 引用: {out.strip()}')

# 5. 检查 server-reference-manifest.json
print('\n=== 3. server-reference-manifest.json ===')
out, _ = run(ssh, 'grep "apply-upgrade" /www/ming8/.next/server/server-reference-manifest.json 2>/dev/null || echo "NOT FOUND"')
print(f'  apply-upgrade: {out.strip()[:80]}')

# 6. 检查 app-paths-manifest.json 完整内容
print('\n=== 4. app-paths-manifest.json ===')
out, _ = run(ssh, 'cat /www/ming8/.next/server/app-paths-manifest.json')
try:
    data = json.loads(out)
    admin_routes = [k for k in data.keys() if '/api/admin/' in k]
    print(f'  API 路由数: {len(data)}')
    print(f'  admin API 路由:')
    for r in admin_routes:
        print(f'    {r}')
except:
    print(f'  解析失败: {out[:200]}')

# 7. 检查 Next.js 版本和配置
print('\n=== 5. server.js 内容 ===')
out, _ = run(ssh, 'head -20 /www/ming8/server.js')
print(out)

ssh.close()
