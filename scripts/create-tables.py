"""在服务器上创建所有缺失的表 - 用正确的 VARCHAR(255) PRIMARY KEY"""
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

# 先查看哪些表已经存在
print('=== 已存在的表 ===')
out, _ = run(ssh, """mysql -u ming8 -p'Ming8@2026!' ming8_db -e "SHOW TABLES" 2>/dev/null""")
existing_tables = set(line.strip() for line in out.split('\n')[1:] if line.strip())
print(out)

# 需要创建的表列表
tables_to_create = {
    'Article': """CREATE TABLE IF NOT EXISTS Article (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100) DEFAULT 'uncategorized',
    content TEXT,
    summary TEXT,
    tags VARCHAR(500),
    coverImage VARCHAR(500),
    status VARCHAR(50) DEFAULT 'draft',
    viewCount INT DEFAULT 0,
    sortOrder INT DEFAULT 0,
    isPublished INT DEFAULT 0,
    publishedAt DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'Notification': """CREATE TABLE IF NOT EXISTS Notification (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    userId VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    content TEXT,
    type VARCHAR(50) DEFAULT 'info',
    isRead INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'MessageTemplate': """CREATE TABLE IF NOT EXISTS MessageTemplate (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'email',
    subject VARCHAR(500),
    content TEXT,
    variables VARCHAR(500),
    isActive INT DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'QuickReply': """CREATE TABLE IF NOT EXISTS QuickReply (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(100),
    sortOrder INT DEFAULT 0,
    isActive INT DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'Encyclopedia': """CREATE TABLE IF NOT EXISTS Encyclopedia (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT,
    tags VARCHAR(500),
    viewCount INT DEFAULT 0,
    sortOrder INT DEFAULT 0,
    isActive INT DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'KnowledgeArticle': """CREATE TABLE IF NOT EXISTS KnowledgeArticle (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    title VARCHAR(500),
    category VARCHAR(100),
    content TEXT,
    tags VARCHAR(500),
    viewCount INT DEFAULT 0,
    helpfulCount INT DEFAULT 0,
    sortOrder INT DEFAULT 0,
    isActive INT DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'Campaign': """CREATE TABLE IF NOT EXISTS Campaign (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    rules TEXT,
    discount VARCHAR(100),
    startAt VARCHAR(50),
    endAt VARCHAR(50),
    isActive INT DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'Channel': """CREATE TABLE IF NOT EXISTS Channel (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    url VARCHAR(500),
    description TEXT,
    clickCount INT DEFAULT 0,
    registerCount INT DEFAULT 0,
    orderCount INT DEFAULT 0,
    commission VARCHAR(100),
    isActive INT DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'TicketMessage': """CREATE TABLE IF NOT EXISTS TicketMessage (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    ticketId VARCHAR(255) NOT NULL,
    userId VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    isStaff INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'ExportTask': """CREATE TABLE IF NOT EXISTS ExportTask (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    format VARCHAR(50) DEFAULT 'csv',
    status VARCHAR(50) DEFAULT 'pending',
    fileUrl TEXT,
    params TEXT,
    createdBy VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'ChatSession': """CREATE TABLE IF NOT EXISTS ChatSession (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    userId VARCHAR(255),
    subject VARCHAR(500),
    status VARCHAR(50) DEFAULT 'open',
    lastMessage TEXT,
    lastMessageAt VARCHAR(50),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'FortuneTeller': """CREATE TABLE IF NOT EXISTS FortuneTeller (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    title VARCHAR(255),
    specialties VARCHAR(500),
    bio TEXT,
    rating DECIMAL(2,1) DEFAULT 5.0,
    reviewCount INT DEFAULT 0,
    consultationCount INT DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    isOnline INT DEFAULT 0,
    isActive INT DEFAULT 1,
    sortOrder INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'MembershipPlan': """CREATE TABLE IF NOT EXISTS MembershipPlan (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    originalPrice DECIMAL(10,2) DEFAULT 0,
    duration INT DEFAULT 30,
    description TEXT,
    features TEXT,
    sortOrder INT DEFAULT 0,
    isActive INT DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'Coupon': """CREATE TABLE IF NOT EXISTS Coupon (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    code VARCHAR(100) NOT NULL,
    discountType VARCHAR(50) NOT NULL DEFAULT 'amount',
    discountValue DECIMAL(10,2) NOT NULL DEFAULT 0,
    minAmount DECIMAL(10,2) DEFAULT 0,
    maxDiscount DECIMAL(10,2) DEFAULT 0,
    totalCount INT DEFAULT 0,
    usedCount INT DEFAULT 0,
    expiryAt DATETIME NULL,
    isActive INT DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",

    'OfferingItem': """CREATE TABLE IF NOT EXISTS OfferingItem (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    image VARCHAR(500),
    price DECIMAL(10,2) DEFAULT 0,
    priceMonth DECIMAL(10,2) DEFAULT 0,
    priceYear DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    category VARCHAR(100),
    sortOrder INT DEFAULT 0,
    isActive INT DEFAULT 1,
    stock INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""",
}

print('\n=== 创建缺失的表 ===')
for table_name, ddl in tables_to_create.items():
    if table_name in existing_tables:
        print('  ⏭️  %s - 已存在' % table_name)
    else:
        out, err = run(ssh, """mysql -u ming8 -p'Ming8@2026!' ming8_db -e "%s" 2>/dev/null && echo OK""" % ddl.replace('"', '\\"'))
        if 'OK' in out:
            print('  ✅ %s - 创建成功' % table_name)
        else:
            print('  ❌ %s - 创建失败: %s' % (table_name, err[:100]))

ssh.close()
print('\n=== 完成 ===')
