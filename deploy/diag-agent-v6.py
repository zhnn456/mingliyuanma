"""查找管理员账号和测试更多API"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=30):
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode(errors='replace').strip()

# 查看管理员
print("管理员账户:")
print(run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, email, role, name FROM User WHERE role = \'admin\';" 2>/dev/null'))

# 测试管理员登录
for email in ['282063152@qq.com', 'admin@ming8.online']:
    print(f"\n登录 {email}:")
    print(run(f'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{{"email":"{email}","password":"Admin@2026!"}}\'')[:300])

# Order表结构
print("\n\nOrder表字段:")
print(run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "DESCRIBE `Order`;" 2>/dev/null'))

# 检查CommissionRecord/SettlementRecord的status字段类型
print("\n\nCommissionRecord表结构:")
print(run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "DESCRIBE CommissionRecord;" 2>/dev/null'))
print("\nSettlementRecord表结构:")
print(run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "DESCRIBE SettlementRecord;" 2>/dev/null'))

# 检查agent-orders的500错误详情
print("\n\nagent-orders 错误详情:")
print(run('curl -s -c /tmp/ac.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\''))
print(run('curl -s -b /tmp/ac.txt http://localhost:3001/api/agent/agent-orders')[:500])

# commissions 错误详情
print("\n\ncommissions 错误详情:")
print(run('curl -s -b /tmp/ac.txt http://localhost:3001/api/agent/commissions')[:500])

# 检查PM2日志中最近500错误
print("\n\n最近500错误:")
print(run('su - admin -c "pm2 logs ming8 --lines 50 --nostream --err" 2>/dev/null | grep -A2 "Error:" | tail -30'))

run('rm -f /tmp/ac.txt')
ssh.close()
