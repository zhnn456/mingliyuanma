"""
D1 → MySQL 数据恢复脚本 v2
修复：表名大小写不敏感匹配
"""
import sqlite3
import paramiko
import base64

# ===== 1. 读取 D1 备份到本地 SQLite 内存库 =====
print("=" * 60)
print("步骤 1: 读取 D1 备份到本地 SQLite 内存库")
print("=" * 60)

with open('deploy/d1-backup.sql', 'r', encoding='utf-8') as f:
    sql_content = f.read()

local_db = sqlite3.connect(':memory:')
local_db.executescript(sql_content)

cursor = local_db.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name")
tables = [row[0] for row in cursor.fetchall()]

print(f"\nD1 共有 {len(tables)} 个表:")
table_data = {}
for table in tables:
    cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
    count = cursor.fetchone()[0]
    if count > 0:
        cursor.execute(f'PRAGMA table_info("{table}")')
        cols = [c[1] for c in cursor.fetchall()]
        table_data[table] = {'count': count, 'cols': cols}

print(f"共 {len(table_data)} 个表有数据，总计 {sum(t['count'] for t in table_data.values())} 条记录")

# ===== 2. 连接服务器 MySQL，查询表结构 =====
print("\n" + "=" * 60)
print("步骤 2: 连接服务器 MySQL，查询表结构")
print("=" * 60)

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

def run_cmd(cmd):
    _, o, e = ssh.exec_command(cmd)
    return o.read().decode(errors='replace').strip(), e.read().decode(errors='replace').strip()

# 查询 MySQL 所有表（返回原始大小写）
out, _ = run_cmd("MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -N -e 'SHOW TABLES' 2>&1")
mysql_tables_raw = [t.strip() for t in out.split('\n') if t.strip()]
# 建立小写 → 原始表名 的映射
mysql_table_map = {t.lower(): t for t in mysql_tables_raw}
print(f"MySQL 共有 {len(mysql_tables_raw)} 个表: {mysql_tables_raw}")

# 查询每个 MySQL 表的列（用原始表名，加反引号避免 Order 等保留字）
mysql_cols = {}
for table in mysql_tables_raw:
    out, _ = run_cmd(f"MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -N -e 'SHOW COLUMNS FROM `{table}`' 2>&1")
    cols = []
    for line in out.split('\n'):
        if line.strip():
            cols.append(line.split('\t')[0].strip())
    # 列名也建小写映射
    mysql_cols[table.lower()] = {'raw_name': table, 'cols': cols, 'cols_lower': [c.lower() for c in cols]}

# ===== 3. 智能适配列并导入 =====
print("\n" + "=" * 60)
print("步骤 3: 智能适配列并导入 MySQL")
print("=" * 60)

# 先扩展 Agent.licenseKey 和 AgentLicense.licenseKey 字段（D1 数据最长 366，超过 VARCHAR(255)）
# 注意：licenseKey 有 UNIQUE 索引，utf8mb4 下 VARCHAR(1000) 超 InnoDB 3072 bytes 限制，用 VARCHAR(500)
print("扩展 licenseKey 字段为 VARCHAR(500)...")
out, err = run_cmd("MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'ALTER TABLE Agent MODIFY COLUMN licenseKey VARCHAR(500);' 2>&1")
combined = out + err
if combined:
    print(f"  Agent ALTER 输出: {combined}")
out, err = run_cmd("MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'ALTER TABLE AgentLicense MODIFY COLUMN licenseKey VARCHAR(500);' 2>&1")
combined = out + err
if combined:
    print(f"  AgentLicense ALTER 输出: {combined}")

# 验证 ALTER 是否生效
out, _ = run_cmd("MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -N -e \"SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='ming8_db' AND TABLE_NAME='Agent' AND COLUMN_NAME='licenseKey';\" 2>&1")
print(f"  Agent.licenseKey 当前类型: {out}")
out, _ = run_cmd("MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -N -e \"SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='ming8_db' AND TABLE_NAME='AgentLicense' AND COLUMN_NAME='licenseKey';\" 2>&1")
print(f"  AgentLicense.licenseKey 当前类型: {out}")

def escape_mysql_value(val):
    if val is None:
        return 'NULL'
    if isinstance(val, (int,)):
        return str(val)
    if isinstance(val, float):
        return str(val)
    if isinstance(val, bytes):
        val = val.decode('utf-8', errors='replace')
    s = str(val)
    # 转换 ISO 8601 时间格式：'2026-07-29T01:51:44.474Z' → '2026-07-29 01:51:44'
    # 匹配 YYYY-MM-DDTHH:MM:SS(.ms)Z 格式
    import re
    s = re.sub(r"(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(\.\d+)?Z", r"\1 \2", s)
    # 转义单引号和反斜杠
    s = s.replace('\\', '\\\\').replace("'", "''")
    return f"'{s}'"

total_imported = 0
total_skipped = 0
errors = []

for d1_table, info in table_data.items():
    d1_cols = info['cols']
    count = info['count']
    d1_table_lower = d1_table.lower()

    # 大小写不敏感匹配表名
    if d1_table_lower not in mysql_cols:
        print(f"  ⚠ {d1_table}: MySQL 无此表，跳过 {count} 条")
        total_skipped += count
        continue

    mysql_info = mysql_cols[d1_table_lower]
    mysql_table_name = mysql_info['raw_name']  # 用 MySQL 原始表名
    mysql_cols_lower = mysql_info['cols_lower']
    mysql_cols_raw = mysql_info['cols']

    # 大小写不敏感匹配列名，保留 D1 中的列名（因为我们要从 D1 读数据）
    # 但生成 SQL 时用 MySQL 的列名
    matching_pairs = []  # (d1_col, mysql_col)
    for i, d1_col in enumerate(d1_cols):
        if d1_col.lower() in mysql_cols_lower:
            mysql_idx = mysql_cols_lower.index(d1_col.lower())
            matching_pairs.append((d1_col, mysql_cols_raw[mysql_idx]))

    skipped_cols = [c for c in d1_cols if c.lower() not in mysql_cols_lower]
    if skipped_cols:
        print(f"  ℹ {d1_table}: 跳过列 {skipped_cols}")

    if not matching_pairs:
        print(f"  ⚠ {d1_table}: 无匹配列，跳过 {count} 条")
        total_skipped += count
        continue

    # 从 D1 读取数据
    d1_col_list = ', '.join(f'"{pair[0]}"' for pair in matching_pairs)
    cursor.execute(f'SELECT {d1_col_list} FROM "{d1_table}"')
    rows = cursor.fetchall()

    # 生成 REPLACE INTO 语句，分批
    batch_size = 30
    imported = 0
    for batch_start in range(0, len(rows), batch_size):
        batch = rows[batch_start:batch_start + batch_size]
        values_str_list = []
        for row in batch:
            values = ', '.join(escape_mysql_value(v) for v in row)
            values_str_list.append(f"({values})")

        # 表名和列名都加反引号（避免 Order/key 等保留字冲突）
        mysql_col_str = ', '.join(f'`{pair[1]}`' for pair in matching_pairs)
        sql = f"REPLACE INTO `{mysql_table_name}` ({mysql_col_str}) VALUES {', '.join(values_str_list)}"

        # base64 编码传输，避免转义问题
        sql_b64 = base64.b64encode(sql.encode('utf-8')).decode('ascii')
        cmd = f"echo '{sql_b64}' | base64 -d | MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db --default-character-set=utf8mb4 2>&1"
        out, err = run_cmd(cmd)
        combined = out + err
        if combined and ('ERROR' in combined.upper() or 'Duplicate' in combined):
            errors.append(f"{d1_table} batch {batch_start//batch_size+1}: {combined[:300]}")
            print(f"  ✗ {d1_table} 批次 {batch_start//batch_size+1} 错误: {combined[:200]}")
        else:
            imported += len(batch)

    print(f"  ✓ {d1_table} → {mysql_table_name}: 导入 {imported}/{count} 条")
    total_imported += imported

# ===== 4. 验证 =====
print("\n" + "=" * 60)
print("步骤 4: 验证导入结果")
print("=" * 60)

# 验证查询（表名和 key 列加反引号）
for table in ['User', 'Agent', 'SiteConfig', 'OfferingCategory', 'OfferingSupply', 'BaziRecord', 'Order', 'PointsLedger', 'UserPoints', 'AgentLicense']:
    out, _ = run_cmd(f"MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -N -e 'SELECT COUNT(*) FROM `{table}`' 2>&1")
    print(f"  MySQL {table}: {out.strip()} 条")

print("\n--- User 表（按角色）---")
out, _ = run_cmd("MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'SELECT id, email, name, role, memberLevel FROM User ORDER BY role' 2>&1")
print(out)

print("\n--- Agent 表 ---")
out, _ = run_cmd("MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'SELECT id, brandName, contactName, level, plan, systemStatus FROM Agent' 2>&1")
print(out)

print("\n--- SiteConfig 表（主键是 key，无 id 列）---")
out, _ = run_cmd("MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'SELECT `key`, LEFT(value,50) as val, category FROM SiteConfig' 2>&1")
print(out)

print("\n--- OfferingCategory 表 ---")
out, _ = run_cmd("MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'SELECT id, name, icon, sortOrder FROM OfferingCategory' 2>&1")
print(out)

print("\n--- Order 表 ---")
out, _ = run_cmd("MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'SELECT id, orderNo, userId, type, amount, status FROM `Order` LIMIT 5' 2>&1")
print(out)

print("\n--- PointsLedger 表 ---")
out, _ = run_cmd("MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'SELECT id, userId, amount, balance, type FROM PointsLedger LIMIT 5' 2>&1")
print(out)

local_db.close()
ssh.close()

print("\n" + "=" * 60)
print(f"恢复完成: 导入 {total_imported} 条, 跳过 {total_skipped} 条, 错误 {len(errors)} 个")
print("=" * 60)
if errors:
    print("\n错误详情:")
    for e in errors:
        print(f"  - {e}")
