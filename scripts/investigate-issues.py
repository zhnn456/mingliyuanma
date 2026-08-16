"""调查 SQL 查询失败的根本原因"""
import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, sql, label=''):
    cmd = """mysql -u ming8 -p'Ming8@2026!' ming8_db 2>&1"""
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    stdin.write(sql + '\n')
    stdin.channel.shutdown_write()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618',
            look_for_keys=False, allow_agent=False, timeout=30)

print('=== 1. FortuneTeller 表结构（找 userId 列） ===')
print(run(ssh, "DESCRIBE FortuneTeller"))

print('\n=== 2. 检查所有相关表的字符集 ===')
print(run(ssh, "SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA='ming8_db' AND TABLE_NAME IN ('User','Order','OfferingRecord','OfferingSupply','Payment','FortuneTeller','AgentShare','Coupon','ExportTask','BaziRecord','ZiweiRecord','QimenRecord','MeihuaRecord','Ticket','UserPoints','PointsLedger') ORDER BY TABLE_NAME"))

print('\n=== 3. 检查 User 表的 id 列字符集 ===')
print(run(ssh, "SELECT COLUMN_NAME, COLLATION_NAME, CHARACTER_SET_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='ming8_db' AND TABLE_NAME='User' AND COLUMN_NAME IN ('id','userId')"))

print('\n=== 4. 检查 OfferingRecord 表的 userId 列字符集 ===')
print(run(ssh, "SELECT COLUMN_NAME, COLLATION_NAME, CHARACTER_SET_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='ming8_db' AND TABLE_NAME='OfferingRecord' AND COLUMN_NAME IN ('userId','itemId')"))

print('\n=== 5. 检查 Order 表的 userId 列字符集 ===')
print(run(ssh, "SELECT COLUMN_NAME, COLLATION_NAME, CHARACTER_SET_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='ming8_db' AND TABLE_NAME='Order' AND COLUMN_NAME IN ('id','userId')"))

print('\n=== 6. 检查 Payment 表的 orderId/userId 列字符集 ===')
print(run(ssh, "SELECT COLUMN_NAME, COLLATION_NAME, CHARACTER_SET_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='ming8_db' AND TABLE_NAME='Payment' AND COLUMN_NAME IN ('orderId','userId','id')"))

print('\n=== 7. 检查 OfferingSupply 的 id 列字符集 ===')
print(run(ssh, "SELECT COLUMN_NAME, COLLATION_NAME, CHARACTER_SET_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='ming8_db' AND TABLE_NAME='OfferingSupply' AND COLUMN_NAME IN ('id','category')"))

print('\n=== 8. 测试 user-profiles 列表查询（不带 JOIN 子查询） ===')
print(run(ssh, "SELECT u.id, u.email, u.name, u.memberLevel, u.memberExpiryAt FROM `User` u LIMIT 1"))

print('\n=== 9. 测试 user-profiles 带 Order 子查询 ===')
print(run(ssh, "SELECT u.id, (SELECT COUNT(*) FROM `Order` o WHERE o.userId = u.id) as orderCount FROM `User` u LIMIT 1"))

print('\n=== 10. 测试 user-profiles 带 COLLATE 修复 ===')
print(run(ssh, "SELECT u.id, (SELECT COUNT(*) FROM `Order` o WHERE o.userId COLLATE utf8mb4_0900_ai_ci = u.id COLLATE utf8mb4_0900_ai_ci) as orderCount FROM `User` u LIMIT 1"))

print('\n=== 11. 测试 OfferingSupply 表完整结构 ===')
print(run(ssh, "DESCRIBE OfferingSupply"))

ssh.close()
print('\n调查完成')
