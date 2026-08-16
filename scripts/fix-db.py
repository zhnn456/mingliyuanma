"""创建 ChatMessage 表并修复字符集问题"""
import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618',
            look_for_keys=False, allow_agent=False, timeout=30)

# 1. 创建 ChatMessage 表
print('=== 1. 创建 ChatMessage 表 ===')
ddl = """CREATE TABLE IF NOT EXISTS ChatMessage (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    sessionId VARCHAR(255),
    sender VARCHAR(50),
    content TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"""
out, err = run(ssh, """mysql -u ming8 -p'Ming8@2026!' ming8_db -e "%s" 2>/dev/null && echo OK""" % ddl.replace('"', '\\"'))
print('  结果:', out or err)

# 2. 修复 tickets 字符集问题 - 统一所有表的字符集
print('\n=== 2. 检查所有表的字符集 ===')
out, _ = run(ssh, """mysql -u ming8 -p'Ming8@2026!' ming8_db -e "SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA='ming8_db'" 2>/dev/null""")
print(out)

# 3. 统一字符集为 utf8mb4_0900_ai_ci
print('\n=== 3. 统一字符集 ===')
tables_str = """ALTER TABLE Ticket CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE TicketMessage CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE User CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE ChatSession CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE ChatMessage CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
"""
out, err = run(ssh, """mysql -u ming8 -p'Ming8@2026!' ming8_db -e "%s" 2>/dev/null && echo OK""" % tables_str.replace('"', '\\"').replace('\n', ' '))
print('  结果:', out or err)

# 4. 检查 Coupon 表结构
print('\n=== 4. Coupon 表结构 ===')
out, _ = run(ssh, """mysql -u ming8 -p'Ming8@2026!' ming8_db -e "DESCRIBE Coupon" 2>/dev/null""")
print(out)

# 5. 检查 DivinationRule 表结构
print('\n=== 5. DivinationRule 表结构 ===')
out, _ = run(ssh, """mysql -u ming8 -p'Ming8@2026!' ming8_db -e "DESCRIBE DivinationRule" 2>/dev/null""")
print(out)

# 6. 查看 OfferingSupply 表是否有 productType 列
print('\n=== 6. Order 表结构 ===')
out, _ = run(ssh, """mysql -u ming8 -p'Ming8@2026!' ming8_db -e "DESCRIBE Order" 2>/dev/null""")
print(out)

ssh.close()
