import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

def run(title, cmd):
    print(f"\n===== {title} =====")
    _, o, e = ssh.exec_command(cmd)
    print(o.read().decode(errors='replace').strip())
    err = e.read().decode(errors='replace').strip()
    if err:
        print("[err]", err)

run("Agent 表完整结构", "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'DESC Agent;' 2>&1")
run("AgentLicense 表完整结构", "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'DESC AgentLicense;' 2>&1")
run("Order 表完整结构", "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'DESC `Order`;' 2>&1")
run("SiteConfig 表完整结构", "MYSQL_PWD='Ming8@2026!' mysql -u ming8 ming8_db -e 'DESC SiteConfig;' 2>&1")

# 看 D1 备份里 Agent 表的 licenseKey 数据长度
print("\n===== D1 备份里 Agent 表数据（前2条）=====")
import sqlite3
local_db = sqlite3.connect(':memory:')
with open('deploy/d1-backup.sql', 'r', encoding='utf-8') as f:
    local_db.executescript(f.read())
cursor = local_db.cursor()
cursor.execute('SELECT id, brandName, LENGTH(licenseKey) as kl, licenseKey FROM Agent')
for row in cursor.fetchall():
    print(f"  id={row[0]}, brand={row[1]}, licenseKey长度={row[2]}, licenseKey前50字符={str(row[3])[:50] if row[3] else 'NULL'}")

print("\n===== D1 备份里 AgentLicense 表数据 =====")
cursor.execute('SELECT id, agentId, LENGTH(licenseKey) as kl, licenseKey FROM AgentLicense')
for row in cursor.fetchall():
    print(f"  id={row[0]}, agentId={row[1]}, licenseKey长度={row[2]}, licenseKey前50字符={str(row[3])[:50] if row[3] else 'NULL'}")

local_db.close()
ssh.close()
