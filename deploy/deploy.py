"""
一键部署脚本：pull → db:init → build → pm2 restart → 记录更新日志 → 验证
用法: python deploy/deploy.py
"""
import paramiko, time, sys

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'
APP_DIR = '/www/ming8'
DB_USER = 'ming8'
DB_PASS = 'Ming8@2026!'
DB_NAME = 'ming8_db'

def run(ssh, cmd, timeout=900):
    print(f"\n>>> {cmd}\n", flush=True)
    transport = ssh.get_transport()
    transport.set_keepalive(30)
    ch = transport.open_session()
    ch.settimeout(timeout)
    ch.exec_command(cmd)
    while not ch.exit_status_ready():
        if ch.recv_ready():
            sys.stdout.write(ch.recv(4096).decode(errors='replace'))
            sys.stdout.flush()
        if ch.recv_stderr_ready():
            sys.stdout.write(ch.recv_stderr(4096).decode(errors='replace'))
            sys.stdout.flush()
        time.sleep(0.3)
    code = ch.recv_exit_status()
    print(f"\n[exit: {code}]")
    return code

def record_deploy_log(ssh):
    """部署成功后自动记录更新日志（采集 git log + version，写入 UpdateLog 表）"""
    print("\n===== 记录更新日志 =====")

    # 1. 获取版本号
    _, stdout, _ = ssh.exec_command(f'cd {APP_DIR} && node -e "console.log(require(\'./package.json\').version)"')
    version = stdout.read().decode(errors='replace').strip()
    print(f"版本: {version}")

    # 2. 获取 git commit hash + 最近5条 log
    _, stdout, _ = ssh.exec_command(f'cd {APP_DIR} && git rev-parse --short HEAD')
    commit = stdout.read().decode(errors='replace').strip()
    print(f"commit: {commit}")

    _, stdout, _ = ssh.exec_command(f'cd {APP_DIR} && git log --oneline -5 --no-decorate')
    logs = stdout.read().decode(errors='replace').strip()
    print(f"近期提交:\n{logs}")

    # 3. 转义单引号（SQL 安全）
    logs_escaped = logs.replace("'", "''").replace('\n', '\\n')
    title = f'部署 v{version} ({commit})'

    # 4. 用 SFTP 写 SQL 文件（避免 shell 引号问题）
    sql = f"""INSERT INTO UpdateLog (id, version, title, content, type, isMajor, operatorName, tag, status, category, isCurrent, createdAt)
VALUES (CONCAT('ul', UNIX_TIMESTAMP()), '{version}', '{title}', '{logs_escaped}', 'update', 0, 'deploy.py', '{commit}', 'success', '部署', 1, NOW())
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), tag=VALUES(tag);"""

    sftp = ssh.open_sftp()
    with sftp.open('/tmp/record_deploy.sql', 'w') as f:
        f.write(sql)
    sftp.close()

    # 5. 执行 SQL
    cmd = f'mysql -u {DB_USER} -p"{DB_PASS}" {DB_NAME} < /tmp/record_deploy.sql 2>&1 | grep -v Warning'
    _, stdout, _ = ssh.exec_command(cmd)
    out = stdout.read().decode(errors='replace').strip()
    print(f"记录结果: {out or '成功'}")

    # 清理
    ssh.exec_command('rm -f /tmp/record_deploy.sql')

    # 6. 验证
    _, stdout, _ = ssh.exec_command(f'mysql -u {DB_USER} -p"{DB_PASS}" {DB_NAME} -e "SELECT id,version,title,tag,createdAt FROM UpdateLog ORDER BY createdAt DESC LIMIT 3" 2>&1 | grep -v Warning')
    print(f"\n最近更新日志:\n{stdout.read().decode(errors='replace')}")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)
print("SSH 连接成功")

steps = [
    ("1. 丢弃版本注入本地改动", f"cd {APP_DIR} && git checkout -- src/lib/version.ts 2>&1 || true"),
    ("2. 拉取代码", f"cd {APP_DIR} && git pull 2>&1"),
    ("3. 同步数据库表", f"cd {APP_DIR} && npm run db:init 2>&1 | tail -15"),
    ("4. 构建(限制内存 1GB)", f"cd {APP_DIR} && set -o pipefail && NODE_OPTIONS=\"--max-old-space-size=1024\" npm run build:server 2>&1 | tail -40"),
    ("5. 重启 PM2 (PORT=3001)", f"pm2 delete ming8 2>/dev/null; cd {APP_DIR} && PORT=3001 pm2 start npm --name ming8 -- start 2>&1"),
    ("6. 等待启动并验证公告API", "sleep 5 && curl -s http://localhost:3001/api/announcement"),
    ("7. 验证健康检查(含版本)", "sleep 2 && curl -s http://localhost:3001/api/health"),
]

for name, cmd in steps:
    print(f"\n===== {name} =====")
    code = run(ssh, cmd)
    if code != 0 and name.startswith("4"):
        print("❌ 构建失败，终止部署")
        ssh.close()
        sys.exit(1)

# 部署成功后记录更新日志
record_deploy_log(ssh)

# 保存 PM2
run(ssh, "pm2 save 2>&1")

print("\n✅ 部署完成（含更新日志记录）")
ssh.close()
