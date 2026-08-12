"""检查服务器当前状态 - 不部署，只测试"""
import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

print("=" * 60)
print("连接服务器测试当前状态")
print("=" * 60)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=30):
    print(f"\n>>> {cmd[:200]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode(errors='replace')
    if out: print(out.strip()[:2000])
    return out.strip()

# 1. PM2状态
print("\n--- PM2 状态 ---")
run('su - admin -c "pm2 list 2>/dev/null" | grep -E "ming8|name|errored|stopped"')

# 2. 首页
print("\n--- 首页 ---")
run('curl -s -o /dev/null -w "首页: %{http_code}\n" --max-time 15 http://localhost:3001')

# 3. 登录代理商
print("\n--- 登录代理商测试账号 ---")
run('curl -s -c /tmp/ac.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\' | head -c 200')

# 4. 代理商所有API
print("\n--- 代理商 API 测试 ---")
apis = [
    ('数据概览 stats', '/api/agent/stats'),
    ('收益看板 dashboard', '/api/agent/dashboard'),
    ('授权信息 license', '/api/agent/license'),
    ('我的订单 agent-orders', '/api/agent/agent-orders'),
    ('分润明细 commissions', '/api/agent/commissions?pageSize=1'),
    ('结算中心 settlements', '/api/agent/settlements'),
    ('客户管理 customers', '/api/agent/customers'),
    ('代理设置 settings', '/api/agent/settings'),
]

agent_pass = 0
agent_fail = []
for name, path in apis:
    out = run(f'curl -s -b /tmp/ac.txt -o /dev/null -w "%{{http_code}}" --max-time 15 http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    icon = '✓' if code == '200' else '✗'
    if code == '200':
        agent_pass += 1
    else:
        agent_fail.append(f"{name}: {code}")
        run(f'curl -s -b /tmp/ac.txt --max-time 10 http://localhost:3001{path} | head -c 200')
    print(f"  {icon} {name}: HTTP {code}")

# 5. 登录管理员
print("\n--- 登录管理员 ---")
run('curl -s -c /tmp/ad.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"282063152@qq.com","password":"admin123"}\' | head -c 200')

# 6. 管理后台API
print("\n--- 管理后台 API 测试 ---")
admin_apis = [
    ('admin/agent-stats', '/api/admin/agent-stats'),
    ('admin/agents', '/api/admin/agents'),
    ('admin/agent-settlement', '/api/admin/agent-settlement'),
    ('admin/commission-records', '/api/admin/commission-records?pageSize=1'),
]

admin_pass = 0
admin_fail = []
for name, path in admin_apis:
    out = run(f'curl -s -b /tmp/ad.txt -o /dev/null -w "%{{http_code}}" --max-time 15 http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    icon = '✓' if code == '200' else '✗'
    if code == '200':
        admin_pass += 1
    else:
        admin_fail.append(f"{name}: {code}")
        run(f'curl -s -b /tmp/ad.txt --max-time 10 http://localhost:3001{path} | head -c 200')
    print(f"  {icon} {name}: HTTP {code}")

run('rm -f /tmp/ac.txt /tmp/ad.txt')

# 检查代理商数据
print("\n--- 代理商列表数据 ---")
run('curl -s -c /tmp/ad2.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"282063152@qq.com","password":"admin123"}\' > /dev/null')
run('curl -s -b /tmp/ad2.txt --max-time 15 http://localhost:3001/api/admin/agents | head -c 500')
run('rm -f /tmp/ad2.txt')

# 最近错误日志
print("\n--- 最近错误日志 ---")
run('su - admin -c "pm2 logs ming8 --lines 15 --nostream --err 2>/dev/null" | tail -20')

ssh.close()

print("\n" + "=" * 60)
print(f"代理商API: {agent_pass}/{len(apis)} 通过")
if agent_fail:
    print(f"失败: {agent_fail}")
print(f"管理后台API: {admin_pass}/{len(admin_apis)} 通过")
if admin_fail:
    print(f"失败: {admin_fail}")
print("=" * 60)
