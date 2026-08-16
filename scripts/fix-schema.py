"""添加 FortuneTeller.userId 列并创建 AgentShare 表"""
import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, sql, label=''):
    cmd = """mysql -u ming8 -p'Ming8@2026!' ming8_db 2>&1"""
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    stdin.write(sql + '\n')
    stdin.channel.shutdown_write()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618',
            look_for_keys=False, allow_agent=False, timeout=30)

print('=== 1. 添加 FortuneTeller.userId 列 ===')
result = run(ssh, 'ALTER TABLE `FortuneTeller` ADD COLUMN `userId` VARCHAR(255)')
if 'ERROR' in result:
    if '1060' in result or 'Duplicate' in result:
        print('  列已存在，跳过')
    else:
        print(f'  错误: {[l for l in result.split(chr(10)) if "ERROR" in l][:1]}')
else:
    print('  OK userId 列已添加')

print('\n=== 2. 添加 FortuneTeller.userId 唯一索引 ===')
result = run(ssh, 'ALTER TABLE `FortuneTeller` ADD UNIQUE INDEX `FortuneTeller_userId_key` (`userId`)')
if 'ERROR' in result:
    if '1061' in result or 'Duplicate' in result or 'exists' in result.lower():
        print('  索引已存在，跳过')
    else:
        print(f'  结果: {[l for l in result.split(chr(10)) if "ERROR" in l][:1]}')
else:
    print('  OK 索引已创建')

print('\n=== 3. 创建 AgentShare 表 ===')
create_sql = """CREATE TABLE IF NOT EXISTS `AgentShare` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `agentId` VARCHAR(255) NOT NULL,
  `orderId` VARCHAR(255) NOT NULL,
  `amount` DOUBLE NOT NULL DEFAULT 0,
  `rate` DOUBLE NOT NULL DEFAULT 0,
  `shareAmount` DOUBLE NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `period` VARCHAR(50),
  `settledAt` DATETIME,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci"""
result = run(ssh, create_sql)
if 'ERROR' in result:
    print(f'  错误: {[l for l in result.split(chr(10)) if "ERROR" in l][:1]}')
else:
    print('  OK AgentShare 表已创建')

print('\n=== 4. 验证 FortuneTeller 表结构 ===')
print(run(ssh, 'DESCRIBE FortuneTeller'))

print('\n=== 5. 验证 AgentShare 表结构 ===')
print(run(ssh, 'DESCRIBE AgentShare'))

print('\n=== 6. 重新测试 fortune-tellers 完整查询 ===')
result = run(ssh, "SELECT ft.id, ft.userId, ft.name, ft.avatar, ft.bio, ft.specialties, ft.rating, ft.isActive, ft.createdAt, ft.updatedAt, u.email as userEmail, u.phone as userPhone, u.name as userUserName, u.role as userRole FROM FortuneTeller ft LEFT JOIN User u ON ft.userId = u.id ORDER BY ft.createdAt DESC LIMIT 20 OFFSET 0")
if 'ERROR' in result:
    print(f'  X {[l for l in result.split(chr(10)) if "ERROR" in l][:1]}')
else:
    print('  OK 查询成功')

print('\n=== 7. 重新测试 finance-agents 完整查询 ===')
result = run(ssh, "SELECT s.*, a.companyName, a.contactName, o.orderNo, o.amount as orderAmount, o.type as orderType FROM AgentShare s LEFT JOIN Agent a ON s.agentId = a.id LEFT JOIN `Order` o ON s.orderId = o.id WHERE 1=1 ORDER BY s.createdAt DESC LIMIT 20 OFFSET 0")
if 'ERROR' in result:
    print(f'  X {[l for l in result.split(chr(10)) if "ERROR" in l][:1]}')
else:
    print('  OK 查询成功')

ssh.close()
print('\n表结构修复完成')
