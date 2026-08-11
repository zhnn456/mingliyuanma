"""验证源码代理测试数据"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

def run(ssh, cmd, timeout=30):
    print(f"\n>>> {cmd}")
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

print("===== 验证测试数据 =====")

# 验证用户
print("\n--- 1. 验证测试用户 ---")
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, email, name, role, memberLevel FROM User WHERE email = \\"test_source@ming8.com\\";"')

# 验证代理商
print("\n--- 2. 验证源码代理商 ---")
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, brandName, domain, level, plan, licenseExpiry, isActive FROM Agent WHERE brandName LIKE \\"%测试源码代理%\\";"')

# 验证授权码
print("\n--- 3. 验证授权码 ---")
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, agentId, domain, status, expiryAt FROM AgentLicense WHERE domain = \\"test-source.ming8.online\\";"')

# 验证订单
print("\n--- 4. 验证购买订单 ---")
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT orderNo, type, amount, status, paymentMethod FROM `Order` WHERE orderNo LIKE \\"SRC%\\" ORDER BY createdAt DESC LIMIT 5;"')

# 验证续费记录
print("\n--- 5. 验证续费记录 ---")
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, type, amount, status, createdAt FROM RenewRecord ORDER BY createdAt DESC LIMIT 5;"')

# 验证siteConfig
print("\n--- 6. 验证代理商siteConfig ---")
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT JSON_EXTRACT(siteConfig, \\"$.deployMode\\") AS deployMode, JSON_EXTRACT(siteConfig, \\"$.planType\\") AS planType, JSON_EXTRACT(siteConfig, \\"$.authorizedDomain\\") AS authorizedDomain, JSON_EXTRACT(siteConfig, \\"$.updateServiceExpiry\\") AS updateServiceExpiry FROM Agent WHERE brandName LIKE \\"%测试源码代理%\\";"')

# 测试API访问（不需要登录的公开接口）
print("\n--- 7. 测试API可达性 ---")
run(ssh, 'curl -s -o /dev/null -w "license API: %{http_code}\\n" http://localhost:3001/api/agent/license')
run(ssh, 'curl -s -o /dev/null -w "renew API: %{http_code}\\n" http://localhost:3001/api/agent/renew')
run(ssh, 'curl -s -o /dev/null -w "tickets API: %{http_code}\\n" http://localhost:3001/api/agent/tickets')

ssh.close()
print("\n===== 验证完成 =====")
