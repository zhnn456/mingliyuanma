"""修复购买订单并模拟完整登录测试"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

def run(ssh, cmd, timeout=30):
    print(f"\n>>> {cmd[:200]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    if out: print(out.strip()[:3000])
    if err and 'Using a password' not in err and 'Warning' not in err:
        print(f"[stderr] {err.strip()[:1000]}")
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

# 检查 Order 表结构
print("--- 检查 Order 表结构 ---")
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "DESCRIBE \`Order\`;" 2>&1 | head -20')

# 检查是否插入成功
print("\n--- 检查订单数据 ---")
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, orderNo, agentId, type, amount, status FROM `Order` WHERE agentId = (SELECT id FROM Agent WHERE brandName LIKE \\"%测试源码代理%\\" LIMIT 1);"')

# 重新插入订单（使用正确字段）
print("\n--- 重新插入购买订单 ---")
sql = '''mysql -uming8 -p"Ming8@2026!" ming8_db -e "
INSERT INTO `Order` (id, orderNo, userId, agentId, type, amount, status, paymentMethod, createdAt, updatedAt)
SELECT CONCAT('ord_fix_', UNIX_TIMESTAMP()), CONCAT('SRC', UNIX_TIMESTAMP()), u.id, a.id, 'agent_license', 2980, 'paid', 'wechat', NOW(), NOW()
FROM User u JOIN Agent a ON a.userId = u.id
WHERE u.email = 'test_source@ming8.com';
"'''
run(ssh, sql)

# 验证
print("\n--- 验证订单 ---")
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT orderNo, type, amount, status, paymentMethod, createdAt FROM `Order` WHERE agentId = (SELECT id FROM Agent WHERE brandName LIKE \\"%测试源码代理%\\" LIMIT 1) ORDER BY createdAt DESC;"')

# 测试登录获取cookie
print("\n--- 模拟登录测试 ---")
run(ssh, '''curl -s -c /tmp/test_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"test_source@ming8.com","password":"Test@2026"}' | head -c 500''')

# 使用cookie访问license API
print("\n--- 测试 license API（登录后） ---")
run(ssh, 'curl -s -b /tmp/test_cookies.txt http://localhost:3001/api/agent/license | head -c 800')

# 使用cookie访问renew API
print("\n--- 测试 renew API（登录后） ---")
run(ssh, 'curl -s -b /tmp/test_cookies.txt http://localhost:3001/api/agent/renew | head -c 800')

# 清理
run(ssh, 'rm -f /tmp/test_cookies.txt')

ssh.close()
print("\n===== 测试完成 =====")
