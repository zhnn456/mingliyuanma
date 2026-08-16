"""统一所有表的字符集为 utf8mb4_0900_ai_ci - 逐表执行避免截断"""
import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, sql, label=''):
    cmd = """mysql -u ming8 -p'Ming8@2026!' ming8_db 2>&1"""
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    stdin.write(sql + '\n')
    stdin.channel.shutdown_write()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

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

# 1. 获取所有需要转换的表名
print('=== 获取需要转换字符集的表 ===')
out = run_raw(ssh, "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='ming8_db' AND TABLE_COLLATION != 'utf8mb4_0900_ai_ci' ORDER BY TABLE_NAME")
tables = [t.strip() for t in out.split('\n') if t.strip()]
print(f'  共 {len(tables)} 个表需要转换: {tables}')

# 2. 逐表转换
print('\n=== 逐表执行 ALTER TABLE CONVERT TO ===')
success = 0
failed = 0
for t in tables:
    result = run(ssh, f"ALTER TABLE `{t}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci")
    if 'ERROR' in result:
        # 提取错误信息
        err_line = [l for l in result.split('\n') if 'ERROR' in l]
        print(f"  X {t}: {err_line[0][:150] if err_line else result[:150]}")
        failed += 1
    else:
        print(f"  OK {t}")
        success += 1

print(f'\n  成功: {success}, 失败: {failed}')

# 3. 验证结果
print('\n=== 修复后的字符集状态 ===')
remaining = run_raw(ssh, "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='ming8_db' AND TABLE_COLLATION != 'utf8mb4_0900_ai_ci'")
print(f'  剩余非 0900 字符集的表数: {remaining}')

if remaining != '0':
    print('  剩余表:')
    print(run(ssh, "SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA='ming8_db' AND TABLE_COLLATION != 'utf8mb4_0900_ai_ci'"))

# 4. 重新测试之前的失败查询
print('\n=== 重新测试 user-profiles 子查询 ===')
result = run(ssh, "SELECT u.id, (SELECT COUNT(*) FROM `Order` o WHERE o.userId = u.id) as orderCount FROM `User` u LIMIT 1")
print(f'  {"OK" if "ERROR" not in result else "X"} {result[:150]}')

print('\n=== 重新测试 offering-records 查询 ===')
result = run(ssh, "SELECT r.id, u.email as userEmail FROM OfferingRecord r LEFT JOIN User u ON r.userId = u.id LIMIT 1")
print(f'  {"OK" if "ERROR" not in result else "X"} {result[:150]}')

print('\n=== 重新测试 transactions-export 查询 ===')
result = run(ssh, "SELECT p.id, o.orderNo FROM `Payment` p LEFT JOIN `Order` o ON p.orderId = o.id LEFT JOIN `User` u ON p.userId = u.id LIMIT 1")
print(f'  {"OK" if "ERROR" not in result else "X"} {result[:150]}')

print('\n=== 重新测试 fortune-tellers 查询 (LEFT JOIN User) ===')
result = run(ssh, "SELECT ft.id, ft.name FROM FortuneTeller ft LEFT JOIN User u ON ft.userId = u.id LIMIT 1")
print(f'  {"OK" if "ERROR" not in result else "X"} {result[:150]}')

ssh.close()
print('\n字符集修复完成')
