import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)
time.sleep(2)

def run(title, cmd):
    print(f"\n===== {title} =====")
    _, o, e = ssh.exec_command(cmd)
    print(o.read().decode(errors='replace').strip()[:2000])

# 登录
run("登录",
    "curl -s -c /tmp/m8.cookie -X POST http://localhost:3001/api/auth/login "
    "-H 'Content-Type: application/json' "
    "-d '{\"email\":\"282063152@qq.com\",\"password\":\"admin123\"}'")

# 触发一次错误请求，方便日志里找到完整堆栈
run("触发 /api/admin/records 错误",
    "curl -s -b /tmp/m8.cookie http://localhost:3001/api/admin/records > /dev/null")

# 看 BaziRecord 表结构
run("BaziRecord 表结构",
    "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'DESC BaziRecord;' 2>&1")

# 看 BaziRecord 记录数
run("BaziRecord 记录数",
    "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'SELECT COUNT(*) AS c FROM BaziRecord;' 2>&1")

# 看完整错误堆栈（最近一条）
run("完整错误堆栈",
    "su - admin -c 'pm2 logs ming8 --lines 60 --nostream --err' 2>&1 | tail -40")

# 直接用 mysql 测试一下 UNION ALL + LIMIT 是否报错
run("直接 MySQL 测试 UNION ALL + LIMIT",
    "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e "
    "\"(SELECT id, userId, name, gender, birthDate, birthTime, createdAt FROM BaziRecord br WHERE 1=1) UNION ALL (SELECT id, userId, name, gender, birthDate, birthTime, createdAt FROM BaziRecord br WHERE 1=1) ORDER BY createdAt DESC LIMIT 20 OFFSET 0;\" 2>&1 | head -5")

ssh.exec_command("rm -f /tmp/m8.cookie")
ssh.close()
print("\n===== 完成 =====")
