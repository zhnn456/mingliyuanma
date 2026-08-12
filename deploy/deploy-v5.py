"""V5 部署：git pull + build + pm2 restart + 验证所有API"""
import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=300):
    print(f"\n>>> {cmd[:200]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    if out: print(out.strip()[:3000])
    if err and 'Using a password' not in err and 'Warning' not in err and 'CryptographyDeprecationWarning' not in err:
        print(f"[stderr] {err.strip()[:1500]}")
    return out.strip()

# Step 1: git pull
print("=" * 60)
print("Step 1: Git Pull")
print("=" * 60)
run('cd /www/ming8 && su - admin -c "cd /www/ming8 && git pull origin main" 2>&1', timeout=60)

# Step 2: install dependencies (if needed)
print("\n" + "=" * 60)
print("Step 2: Install Dependencies")
print("=" * 60)
run('cd /www/ming8 && su - admin -c "cd /www/ming8 && npm install --legacy-peer-deps" 2>&1 | tail -5', timeout=120)

# Step 3: build
print("\n" + "=" * 60)
print("Step 3: Build (Next.js)")
print("=" * 60)
run('cd /www/ming8 && su - admin -c "cd /www/ming8 && NODE_OPTIONS=\'--max-old-space-size=768\' npx next build" 2>&1 | tail -30', timeout=600)

# Step 4: restart
print("\n" + "=" * 60)
print("Step 4: Restart PM2")
print("=" * 60)
run('su - admin -c "pm2 restart ming8" 2>/dev/null')
print("等待5秒...")
time.sleep(5)

# Step 5: 验证服务启动
print("\n" + "=" * 60)
print("Step 5: 验证服务")
print("=" * 60)
run('curl -s -o /dev/null -w "HTTP: %{http_code}" --max-time 30 http://localhost:3001')

# Step 6: 测试所有代理商API
print("\n" + "=" * 60)
print("Step 6: 测试所有代理商API")
print("=" * 60)

# 代理商登录
run('curl -s -c /tmp/agent_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\' | head -c 200')

apis = [
    ('数据概览 stats', '/api/agent/stats'),
    ('收益看板 dashboard', '/api/agent/dashboard'),
    ('授权信息 license', '/api/agent/license'),
    ('续费管理 renew', '/api/agent/renew'),
    ('技术工单 tickets', '/api/agent/tickets'),
    ('我的订单 agent-orders', '/api/agent/agent-orders'),
    ('分润明细 commissions', '/api/agent/commissions?pageSize=1'),
    ('结算中心 settlements', '/api/agent/settlements'),
    ('客户管理 customers', '/api/agent/customers'),
    ('代理设置 settings', '/api/agent/settings'),
    ('代理结算2 agent-settlements', '/api/agent/agent-settlements'),
    ('订单列表 orders', '/api/agent/orders'),
]

all_pass = True
for name, path in apis:
    out = run(f'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "%{{http_code}}" http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    status_icon = '✓' if code == '200' else '✗'
    if code != '200':
        all_pass = False
        err_out = run(f'curl -s -b /tmp/agent_cookies.txt http://localhost:3001{path} | head -c 300')
    print(f"  {status_icon} {name}: HTTP {code}")

# 管理后台API
print("\n--- 管理后台 API ---")
run('curl -s -c /tmp/admin_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"282063152@qq.com","password":"admin123"}\' | head -c 200')

admin_apis = [
    ('admin/agent-stats', '/api/admin/agent-stats'),
    ('admin/agents', '/api/admin/agents'),
    ('admin/agent-review', '/api/admin/agent-review'),
    ('admin/agent-settlement', '/api/admin/agent-settlement'),
    ('admin/commission-records', '/api/admin/commission-records?pageSize=1'),
]

for name, path in admin_apis:
    out = run(f'curl -s -b /tmp/admin_cookies.txt -o /dev/null -w "%{{http_code}}" http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    status_icon = '✓' if code == '200' else '✗'
    if code != '200':
        all_pass = False
        err_out = run(f'curl -s -b /tmp/admin_cookies.txt http://localhost:3001{path} | head -c 300')
    print(f"  {status_icon} {name}: HTTP {code}")

# 清理
run('rm -f /tmp/agent_cookies.txt /tmp/admin_cookies.txt')

# Step 7: 查看错误日志
print("\n" + "=" * 60)
print("Step 7: 错误日志")
print("=" * 60)
run('su - admin -c "pm2 logs ming8 --lines 20 --nostream --err" 2>/dev/null | tail -20')

ssh.close()

print("\n" + "=" * 60)
print(f"{'✓ 全部通过' if all_pass else '✗ 部分失败，请查看上方日志'}")
print("=" * 60)
