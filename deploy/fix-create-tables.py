"""修复1：创建缺失的排盘记录表 + 修复子查询别名"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

SQL = """-- 1. 创建 ZiweiRecord 表（紫微斗数排盘记录）
CREATE TABLE IF NOT EXISTS `ZiweiRecord` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `gender` VARCHAR(50) NOT NULL,
  `birthDate` VARCHAR(50) NOT NULL,
  `birthTime` VARCHAR(50) NOT NULL,
  `isLunar` TINYINT(1) NOT NULL DEFAULT 0,
  `mingGong` VARCHAR(255),
  `palaceData` TEXT,
  `starData` TEXT,
  `sihuaData` TEXT,
  `interpretation` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `ZiweiRecord_userId_idx` (`userId`),
  INDEX `ZiweiRecord_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 创建 QimenRecord 表（奇门遁甲排盘记录）
CREATE TABLE IF NOT EXISTS `QimenRecord` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `queryTime` VARCHAR(50) NOT NULL,
  `dunType` VARCHAR(50),
  `juNumber` INT,
  `tianPan` TEXT,
  `diPan` TEXT,
  `renPan` TEXT,
  `shenPan` TEXT,
  `interpretation` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `QimenRecord_userId_idx` (`userId`),
  INDEX `QimenRecord_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 创建 MeihuaRecord 表（梅花易数排盘记录）
CREATE TABLE IF NOT EXISTS `MeihuaRecord` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `method` VARCHAR(50),
  `input` TEXT,
  `upperGua` VARCHAR(50),
  `lowerGua` VARCHAR(50),
  `dongYao` INT,
  `benGua` VARCHAR(255),
  `huGua` VARCHAR(255),
  `bianGua` VARCHAR(255),
  `tiYong` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `MeihuaRecord_userId_idx` (`userId`),
  INDEX `MeihuaRecord_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 验证表创建
SELECT 'BaziRecord' AS tbl, COUNT(*) AS cnt FROM BaziRecord
UNION ALL
SELECT 'ZiweiRecord', COUNT(*) FROM ZiweiRecord
UNION ALL
SELECT 'QimenRecord', COUNT(*) FROM QimenRecord
UNION ALL
SELECT 'MeihuaRecord', COUNT(*) FROM MeihuaRecord;
"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

# 上传 SQL
sftp = ssh.open_sftp()
with sftp.open('/tmp/create_records.sql', 'w') as f:
    f.write(SQL)
sftp.close()
print("✓ SQL已上传")

# 执行
print("\n执行创建表...")
_, stdout, stderr = ssh.exec_command('mysql -uming8 -p"Ming8@2026!" ming8_db < /tmp/create_records.sql 2>&1', timeout=30)
out = stdout.read().decode(errors='replace')
err = stderr.read().decode(errors='replace')
if out: print(out.strip())
if err and 'Warning' not in err: print(f"[stderr] {err.strip()}")

# 清理
ssh.exec_command('rm -f /tmp/create_records.sql')

# 验证
print("\n验证表...")
_, stdout, _ = ssh.exec_command('mysql -uming8 -p"Ming8@2026!" ming8_db -e "SHOW TABLES LIKE \\"%Record\\";" 2>/dev/null', timeout=10)
print(stdout.read().decode(errors='replace').strip())

ssh.close()
print("\n✓ 完成")
