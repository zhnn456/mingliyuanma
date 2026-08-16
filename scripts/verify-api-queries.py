"""验证 7 个修复后的 API SQL 查询在生产数据库上能正确执行（只读 SELECT）
使用 stdin 传递 SQL 避免反引号被 shell 命令替换吃掉"""
import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, sql, label):
    # 通过 stdin 传递 SQL，避免 shell 解析反引号/引号
    cmd = """mysql -u ming8 -p'Ming8@2026!' ming8_db --table 2>&1"""
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    stdin.write(sql + '\n')
    stdin.channel.shutdown_write()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    combined = out + ('\n' + err if err else '')
    if 'ERROR' in combined:
        # 提取 ERROR 行
        for line in combined.split('\n'):
            if 'ERROR' in line:
                print(f"  X {label}: {line[:200]}")
                return False
        print(f"  X {label}: {combined[:200]}")
        return False
    else:
        # 截取前 100 字符显示
        preview = out[:100].replace('\n', ' | ')
        print(f"  OK {label}: {preview}")
        return True

def run_raw(ssh, sql):
    cmd = """mysql -u ming8 -p'Ming8@2026!' ming8_db --skip-column-names 2>/dev/null"""
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    stdin.write(sql + '\n')
    stdin.channel.shutdown_write()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618',
            look_for_keys=False, allow_agent=False, timeout=30)

print('=== 1. 检查相关表是否存在 ===')
tables = ['Coupon', 'FortuneTeller', 'OfferingRecord', 'OfferingSupply',
          'AgentShare', 'Agent', 'Order', 'Payment', 'User', 'ExportTask',
          'ZiweiRecord', 'QimenRecord', 'MeihuaRecord', 'BaziRecord',
          'Ticket', 'UserPoints', 'PointsLedger', 'SiteConfig']
out = run_raw(ssh, "SELECT GROUP_CONCAT(TABLE_NAME) FROM information_schema.TABLES WHERE TABLE_SCHEMA='ming8_db'")
existing = set(t.strip() for t in out.split(',') if t.strip()) if out else set()
print(f"  已存在的表 ({len(existing)}): {sorted(existing)}")
for t in tables:
    status = 'EXISTS' if t in existing else 'MISSING'
    print(f"    {t}: {status}")

print('\n=== 2. 测试 coupons 查询 ===')
run(ssh, "SELECT * FROM `Coupon` ORDER BY `createdAt` DESC LIMIT 20 OFFSET 0", 'coupons 列表')

print('\n=== 3. 测试 fortune-tellers 查询 ===')
run(ssh, "SELECT ft.id, ft.userId, ft.name, ft.avatar, ft.bio, ft.specialties, ft.rating, ft.isActive, ft.createdAt, ft.updatedAt, u.email as userEmail, u.phone as userPhone, u.name as userUserName, u.role as userRole FROM FortuneTeller ft LEFT JOIN User u ON ft.userId = u.id ORDER BY ft.createdAt DESC LIMIT 20 OFFSET 0", 'fortune-tellers 列表')

print('\n=== 4. 测试 offering-records 查询 ===')
run(ssh, "SELECT r.*, u.email as userEmail, u.name as userName, u.phone as userPhone, oi.name as itemName, oi.category as categoryId FROM OfferingRecord r LEFT JOIN User u ON r.userId = u.id LEFT JOIN OfferingSupply oi ON r.itemId = oi.id ORDER BY r.createdAt DESC LIMIT 20 OFFSET 0", 'offering-records 列表')

print('\n=== 5. 测试 finance-agents 主查询 ===')
run(ssh, "SELECT s.*, a.companyName, a.contactName, o.orderNo, o.amount as orderAmount, o.type as orderType FROM AgentShare s LEFT JOIN Agent a ON s.agentId = a.id LEFT JOIN `Order` o ON s.orderId = o.id WHERE 1=1 ORDER BY s.createdAt DESC LIMIT 20 OFFSET 0", 'finance-agents 列表')

print('\n=== 6. 测试 finance-agents 汇总查询 ===')
run(ssh, "SELECT COUNT(*) as totalRecords, COALESCE(SUM(shareAmount), 0) as totalShare, COALESCE(SUM(CASE WHEN status = 'settled' THEN shareAmount ELSE 0 END), 0) as settledAmount, COALESCE(SUM(CASE WHEN status = 'pending' THEN shareAmount ELSE 0 END), 0) as pendingAmount FROM AgentShare WHERE createdAt >= '2026-01-01' AND createdAt <= '2026-12-31'", 'finance-agents 汇总')

print('\n=== 7. 测试 revenue 查询 ===')
run(ssh, "SELECT * FROM `Order` WHERE status = 'paid' AND createdAt >= '2026-07-18 00:00:00' ORDER BY createdAt", 'revenue 付款订单')

print('\n=== 8. 测试 user-profiles 列表查询 ===')
run(ssh, "SELECT u.id, u.email, u.name, u.phone, u.avatar, u.role, u.memberLevel, u.memberExpiryAt, u.createdAt, (SELECT COUNT(*) FROM `Order` o WHERE o.userId = u.id) as orderCount, (SELECT COALESCE(SUM(amount), 0) FROM `Order` o WHERE o.userId = u.id) as totalAmount, (SELECT COUNT(*) FROM BaziRecord b WHERE b.userId = u.id) + (SELECT COUNT(*) FROM ZiweiRecord z WHERE z.userId = u.id) + (SELECT COUNT(*) FROM QimenRecord q WHERE q.userId = u.id) + (SELECT COUNT(*) FROM MeihuaRecord m WHERE m.userId = u.id) as divinationCount FROM `User` u WHERE 1=1 ORDER BY u.createdAt DESC LIMIT 20 OFFSET 0", 'user-profiles 列表')

print('\n=== 9. 测试 user-profiles 详情 UNION 子查询 ===')
run(ssh, "SELECT MAX(createdAt) as lastTime FROM (SELECT createdAt FROM `Order` WHERE userId = 'test' UNION ALL SELECT createdAt FROM BaziRecord WHERE userId = 'test' UNION ALL SELECT createdAt FROM ZiweiRecord WHERE userId = 'test' UNION ALL SELECT createdAt FROM QimenRecord WHERE userId = 'test' UNION ALL SELECT createdAt FROM MeihuaRecord WHERE userId = 'test' UNION ALL SELECT createdAt FROM Ticket WHERE userId = 'test') AS sub", 'user-profiles UNION 子查询')

print('\n=== 10. 测试 transactions-export 主查询 ===')
run(ssh, "SELECT p.*, o.orderNo, o.type as orderType, o.status as orderStatus, o.amount as orderAmount, u.email as userEmail, u.name as userName FROM `Payment` p LEFT JOIN `Order` o ON p.orderId = o.id LEFT JOIN `User` u ON p.userId = u.id WHERE 1=1 ORDER BY p.createdAt DESC LIMIT 20 OFFSET 0", 'transactions-export 主查询')

print('\n=== 11. 测试 transactions-export ExportTask 查询 ===')
run(ssh, "SELECT * FROM ExportTask ORDER BY createdAt DESC LIMIT 50", 'transactions-export ExportTask')

print('\n=== 12. 测试 user-profiles 表结构（验证列名 memberExpiryAt） ===')
run(ssh, "DESCRIBE `User`", 'User 表结构')

print('\n=== 13. 测试 OfferingSupply 表结构（验证 category 列） ===')
run(ssh, "DESCRIBE OfferingSupply", 'OfferingSupply 表结构')

print('\n=== 14. 测试 Order 表结构（验证 type 列） ===')
run(ssh, "DESCRIBE `Order`", 'Order 表结构')

print('\n=== 15. 测试 FortuneTeller 表结构（验证 VARCHAR 主键） ===')
run(ssh, "DESCRIBE FortuneTeller", 'FortuneTeller 表结构')

print('\n=== 16. 测试 AgentShare 表结构（验证 status VARCHAR） ===')
run(ssh, "DESCRIBE AgentShare", 'AgentShare 表结构')

ssh.close()
print('\n验证完成')
