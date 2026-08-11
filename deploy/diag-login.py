import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

# 标准化的 MySQL 命令前缀（避免密码含特殊字符出问题，使用 MYSQL_PWD 环境变量）
def run(title, cmd):
    print(f"\n===== {title} =====")
    _, o, e = ssh.exec_command(cmd)
    out = o.read().decode(errors='replace').strip()
    err = e.read().decode(errors='replace').strip()
    if out:
        print(out)
    if err:
        print("[stderr]", err)

# PM2 状态
run("PM2 状态", "su - admin -c 'pm2 list' 2>&1 | grep -E 'ming8|name|online'")

# MySQL 连接测试（用 MYSQL_PWD 避免密码警告）
run("MySQL 连接测试",
    "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'SELECT 1 AS ok;' 2>&1")

# User 表结构
run("User 表结构",
    "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'DESC User;' 2>&1")

# User 记录
run("User 记录数（按角色）",
    "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'SELECT role, COUNT(*) AS cnt FROM User GROUP BY role;' 2>&1")

# 管理员邮箱
run("管理员邮箱列表",
    "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e \"SELECT id, email, name, role, LEFT(passwordHash, 10) AS hashPrefix FROM User WHERE role='admin';\" 2>&1")

# .env 中 MYSQL 配置
run(".env 中 MYSQL 配置",
    "grep -E '^MYSQL_' /www/ming8/.env 2>&1")

# 看 ming8 最近的错误日志（按 '数据库' / 'login' / 'error' 过滤）
run("PM2 ming8 最近 100 行日志（含 login/error 关键字）",
    "su - admin -c 'pm2 logs ming8 --lines 200 --nostream' 2>&1 | grep -iE 'login|数据库|error|mysql|ECONN|ER_' | tail -60")

# 模拟一次登录请求（直接 curl 本地 API）
run("模拟登录请求（管理员账号）",
    """curl -s -X POST http://localhost:3001/api/auth/login \
       -H 'Content-Type: application/json' \
       -d '{"email":"282063152@qq.com","password":"admin123"}' 2>&1 | head -c 800""")

# 健康检查
run("健康检查", "curl -s -o /dev/null -w '%{http_code} %{time_total}s' http://localhost:3001/api/health")

ssh.close()
print("\n===== 诊断完成 =====")
