"""V5 综合诊断：表结构 + Agent 数据 + 实际 API 测试"""
import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=30):
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace').strip()
    err = stderr.read().decode(errors='replace').strip()
    return out, err

print("=" * 60)
print("第1步：检查表是否存在")
print("=" * 60)
out, _ = run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "SHOW TABLES;" 2>/dev/null')
print(out)

print("\n" + "=" * 60)
print("第2步：检查关键表的字段结构")
print("=" * 60)
for tbl in ['Agent', 'AgentLicense', 'Order', 'User', 'BaziRecord', 'ZiweiRecord', 'QimenRecord', 'MeihuaRecord', 'CommissionRecord', 'SettlementRecord']:
    out, err = run(f'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SHOW COLUMNS FROM `{tbl}`;" 2>&1')
    if 'ERROR' in out or 'doesn\'t exist' in out:
        print(f"\n✗ 表 {tbl} 不存在或出错: {out[:200]}")
    else:
        # 仅打印字段名
        fields = [line.split('\t')[0] for line in out.split('\n')[1:] if line.strip()]
        print(f"\n✓ {tbl}: {', '.join(fields)}")

print("\n" + "=" * 60)
print("第3步：检查 Agent 表实际数据（最新3条）")
print("=" * 60)
out, _ = run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, userId, brandName, level, plan, planExpiry, licenseKey, licenseExpiry, isActive, domain FROM Agent ORDER BY createdAt DESC LIMIT 5\\G" 2>/dev/null')
print(out)

print("\n" + "=" * 60)
print("第4步：检查 AgentLicense 表数据")
print("=" * 60)
out, _ = run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, agentId, licenseKey, domain, maxUsers, status, expiryAt, createdAt FROM AgentLicense ORDER BY createdAt DESC LIMIT 5\\G" 2>/dev/null')
print(out)

print("\n" + "=" * 60)
print("第5步：检查 Order 表是否有 agentId 字段")
print("=" * 60)
out, _ = run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "SHOW COLUMNS FROM `Order` LIKE \'agentId\';" 2>/dev/null')
print(out if out.strip() else "✗ Order 表没有 agentId 字段")

print("\n" + "=" * 60)
print("第6步：测试 agent API 实际返回（500 错误）")
print("=" * 60)

# 先登录测试代理账号
out, _ = run('curl -s -c /tmp/agent_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\'')
print(f"登录返回: {out[:300]}")

# 测试每个 API 并获取错误详情
apis = [
    ('stats', '/api/agent/stats'),
    ('dashboard', '/api/agent/dashboard'),
    ('license', '/api/agent/license'),
    ('commissions', '/api/agent/commissions'),
    ('agent-orders', '/api/agent/agent-orders'),
    ('customers', '/api/agent/customers'),
    ('settlements', '/api/agent/settlements'),
    ('agent-settlements', '/api/agent/agent-settlements'),
]
for name, path in apis:
    out, _ = run(f'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "%{{http_code}}" http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    if code == '200':
        print(f"✓ {name}: 200")
    else:
        body, _ = run(f'curl -s -b /tmp/agent_cookies.txt http://localhost:3001{path}')
        print(f"✗ {name}: HTTP {code} - {body[:400]}")

# 测试 admin/agent-stats
print("\n--- 管理后台 ---")
out, _ = run('curl -s -c /tmp/admin_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"282063152@qq.com","password":"Admin@2026!"}\'')
print(f"管理员登录: {out[:200]}")

out, _ = run('curl -s -b /tmp/admin_cookies.txt -o /dev/null -w "%{http_code}" http://localhost:3001/api/admin/agent-stats')
print(f"admin/agent-stats: HTTP {out.strip()}")
if out.strip() != '200':
    body, _ = run('curl -s -b /tmp/admin_cookies.txt http://localhost:3001/api/admin/agent-stats')
    print(f"错误: {body[:500]}")

out, _ = run('curl -s -b /tmp/admin_cookies.txt -o /dev/null -w "%{http_code}" http://localhost:3001/api/admin/agents')
print(f"admin/agents: HTTP {out.strip()}")

# 清理
run('rm -f /tmp/agent_cookies.txt /tmp/admin_cookies.txt')

print("\n" + "=" * 60)
print("第7步：查看 PM2 日志中的 500 错误堆栈")
print("=" * 60)
out, _ = run('su - admin -c "pm2 logs ming8 --lines 100 --nostream --err" 2>/dev/null | tail -100')
print(out[-3000:])

ssh.close()
print("\n✓ 诊断完成")
