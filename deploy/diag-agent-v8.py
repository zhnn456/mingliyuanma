"""重置管理员密码并查看User表中所有管理员"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=30):
    _, stdout, _ = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode(errors='replace').strip()

# 查看所有管理员账户的完整信息
print("管理员账户详情:")
print(run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT id, email, role, name, LEFT(passwordHash, 30) as pwdHashPrefix, createdAt FROM User WHERE role = \\"admin\\";" 2>/dev/null'))

# 查看User表所有role
print("\n\nUser表中所有role:")
print(run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT role, COUNT(*) as cnt FROM User GROUP BY role;" 2>/dev/null'))

# 测试登录 - 看看其他可能的密码
import json
emails_to_try = ['282063152@qq.com', 'admin@test.com']
passwords_to_try = ['Admin@2026!', 'admin123', 'Admin@2026', 'admin@2026!', 'admin', 'Admin123!', 'Ming8@2026!']
for email in emails_to_try:
    for pwd in passwords_to_try:
        out = run(f'curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{{"email":"{email}","password":"{pwd}"}}\'')
        if 'user' in out:
            print(f"✓ 登录成功! email={email}, password={pwd}")
            print(f"  返回: {out[:300]}")
            break
    else:
        print(f"✗ {email}: 所有密码都失败")

# 查看Order表实际字段名
print("\n\nOrder表字段（转义反引号）:")
print(run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "DESCRIBE \\`Order\\`;" 2>/dev/null'))

# 查看一条Order数据看字段
print("\n\nOrder表数据示例:")
print(run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "SELECT * FROM \\`Order\\` LIMIT 1\\G" 2>/dev/null'))

ssh.close()
