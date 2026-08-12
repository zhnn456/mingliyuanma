"""完整测试所有代理商API"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

def run(ssh, cmd, timeout=30):
    print(f"\n>>> {cmd[:200]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    if out: print(out.strip()[:2000])
    if err and 'Using a password' not in err and 'Warning' not in err:
        print(f"[stderr] {err.strip()[:1000]}")
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

# 1. 查找管理员账号
print("="*60)
print("1. 查找管理员账号")
print("="*60)
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, email, name, role FROM User WHERE role = \\"admin\\" OR role = \\"ADMIN\\" LIMIT 5;" 2>/dev/null')

# 2. 测试 admin/agent-stats（用管理员登录）
print("\n" + "="*60)
print("2. 测试 admin/agent-stats API（之前500错误的源头）")
print("="*60)
# 尝试多个管理员邮箱
admin_emails = ['admin@ming8.online', 'admin', 'admin@localhost']
for email in admin_emails:
    result = run(ssh, f'curl -s -c /tmp/admin_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{{"email":"{email}","password":"Admin@2026!"}}\'')
    if '"role":"admin"' in result or '"user":{"id"' in result:
        print(f"  ✓ 管理员登录成功: {email}")
        break
    else:
        print(f"  ✗ {email} 登录失败")

# 测试 admin/agent-stats
run(ssh, 'curl -s -b /tmp/admin_cookies.txt http://localhost:3001/api/admin/agent-stats | head -c 500')

# 3. 测试代理商API
print("\n" + "="*60)
print("3. 测试代理商API（用源码代理登录）")
print("="*60)
run(ssh, 'curl -s -c /tmp/agent_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\' | head -c 200')

# 测试所有代理商API
print("\n--- 3.1 数据概览 stats ---")
run(ssh, 'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "HTTP: %{http_code}" http://localhost:3001/api/agent/stats')

print("\n--- 3.2 收益看板 dashboard ---")
run(ssh, 'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "HTTP: %{http_code}" http://localhost:3001/api/agent/dashboard')

print("\n--- 3.3 授权信息 license ---")
run(ssh, 'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "HTTP: %{http_code}" http://localhost:3001/api/agent/license')

print("\n--- 3.4 续费管理 renew ---")
run(ssh, 'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "HTTP: %{http_code}" http://localhost:3001/api/agent/renew')

print("\n--- 3.5 技术工单 tickets ---")
run(ssh, 'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "HTTP: %{http_code}" http://localhost:3001/api/agent/tickets')

print("\n--- 3.6 我的订单 agent-orders ---")
run(ssh, 'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "HTTP: %{http_code}" http://localhost:3001/api/agent/agent-orders')

print("\n--- 3.7 分润明细 commissions ---")
run(ssh, 'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "HTTP: %{http_code}" "http://localhost:3001/api/agent/commissions?pageSize=1"')

print("\n--- 3.8 结算中心 settlements ---")
run(ssh, 'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "HTTP: %{http_code}" http://localhost:3001/api/agent/settlements')

print("\n--- 3.9 客户管理 customers ---")
run(ssh, 'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "HTTP: %{http_code}" http://localhost:3001/api/agent/customers')

print("\n--- 3.10 代理设置 settings ---")
run(ssh, 'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "HTTP: %{http_code}" http://localhost:3001/api/agent/settings')

# 清理
run(ssh, 'rm -f /tmp/admin_cookies.txt /tmp/agent_cookies.txt')

ssh.close()
print("\n" + "="*60)
print("✓ 测试完成")
print("="*60)
