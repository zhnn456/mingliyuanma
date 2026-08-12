"""全面诊断代理商模块问题"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

def run(ssh, cmd, timeout=30):
    print(f"\n>>> {cmd[:200]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    if out: print(out.strip()[:4000])
    if err and 'Using a password' not in err and 'Warning' not in err:
        print(f"[stderr] {err.strip()[:2000]}")
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

print("="*60)
print("1. 查看 PM2 日志找 stats API 500 错误")
print("="*60)
run(ssh, 'su - admin -c "pm2 logs ming8 --lines 100 --nostream" 2>&1 | grep -A 2 "stats\\|500\\|error" | tail -40')

print("\n" + "="*60)
print("2. 检查 BaziRecord 等表是否存在")
print("="*60)
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SHOW TABLES LIKE \\"%Record%\\";" 2>/dev/null')

print("\n" + "="*60)
print("3. 检查 AgentLicense 表")
print("="*60)
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "DESCRIBE AgentLicense;" 2>/dev/null')
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT COUNT(*) AS total, status FROM AgentLicense GROUP BY status;" 2>/dev/null')
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, agentId, LEFT(licenseKey, 40) AS licenseKey_prefix, status, expiryAt FROM AgentLicense ORDER BY createdAt DESC LIMIT 5;" 2>/dev/null')

print("\n" + "="*60)
print("4. 检查测试代理商的 licenseKey")
print("="*60)
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, brandName, level, LEFT(licenseKey, 60) AS licenseKey, licenseExpiry FROM Agent ORDER BY createdAt DESC LIMIT 5;" 2>/dev/null')

print("\n" + "="*60)
print("5. 直接调用 stats API 查看错误")
print("="*60)
run(ssh, 'curl -s -c /tmp/agent_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\' > /dev/null')
run(ssh, 'curl -s -b /tmp/agent_cookies.txt http://localhost:3001/api/agent/stats')
run(ssh, 'curl -s -b /tmp/agent_cookies.txt http://localhost:3001/api/agent/license | head -c 500')
run(ssh, 'rm -f /tmp/agent_cookies.txt')

print("\n" + "="*60)
print("6. 检查 Agent 表的字段 - 是否有 level 字段")
print("="*60)
run(ssh, 'mysql -uming8 -p"Ming8@2026!" ming8_db -e "DESCRIBE Agent;" 2>/dev/null')

ssh.close()
print("\n" + "="*60)
print("诊断完成")
print("="*60)
