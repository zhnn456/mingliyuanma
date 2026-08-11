import paramiko, os, time, sys

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'
LOCAL_ZIP = r'f:\mingliyuanma\next-build.zip'
REMOTE_ZIP = '/www/ming8/next-build.zip'

def run(ssh, cmd, timeout=180):
    print(f"\n>>> {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out.strip())
    if err: print(f"[stderr] {err.strip()}")
    return out, err

def record_deploy_log(ssh):
    """部署成功后自动写入更新日志（UpdateLog 表）"""
    print("\n===== 记录更新日志 =====")
    # 1. 版本号 + commit
    _, stdout, _ = ssh.exec_command('cd /www/ming8 && node -e "console.log(require(\'./package.json\').version)"')
    version = stdout.read().decode(errors='replace').strip()
    _, stdout, _ = ssh.exec_command('cd /www/ming8 && git rev-parse --short HEAD')
    commit = stdout.read().decode(errors='replace').strip()
    _, stdout, _ = ssh.exec_command('cd /www/ming8 && git log --oneline -5 --no-decorate')
    logs = stdout.read().decode(errors='replace').strip()
    print(f"版本: {version} | commit: {commit}")

    # 2. 生成 SQL（转义单引号，防注入）
    logs_escaped = logs.replace("'", "''").replace('\n', '\\n')
    title = f'部署 v{version} ({commit})'
    sql = f"""INSERT INTO UpdateLog (id, version, title, content, type, isMajor, operatorName, tag, status, kind, createdAt)
VALUES (CONCAT('ul', UNIX_TIMESTAMP()), '{version}', '{title}', '{logs_escaped}', 'update', 0, 'remote-deploy.py', '{commit}', 'success', 'deploy', NOW());"""

    # 3. SFTP 写 SQL 再执行（避免 shell 引号问题）
    sftp = ssh.open_sftp()
    with sftp.open('/tmp/record_deploy.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    _, stdout, _ = ssh.exec_command("mysql -u ming8 -p'Ming8@2026!' ming8_db < /tmp/record_deploy.sql 2>&1 | grep -v 'Using a password'")
    out = stdout.read().decode(errors='replace').strip()
    print(f"记录结果: {out or '成功'}")
    ssh.exec_command('rm -f /tmp/record_deploy.sql')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)
print("SSH 连接成功")

# 1. 停掉所有 PM2 实例的 ming8（root 与 admin 两套实例都停，避免端口冲突）
print("\n===== 1/6 停止 ming8 进程（root + admin 双实例）=====")
run(ssh, 'pm2 stop ming8 2>/dev/null; pm2 delete ming8 2>/dev/null; echo "root 实例已清理"')
run(ssh, 'su - admin -c "pm2 stop ming8 2>/dev/null; pm2 delete ming8 2>/dev/null; echo admin 实例已清理"')
run(ssh, 'sleep 2; ss -tlnp | grep 3001 && echo "⚠️ 端口仍被占用" || echo "✅ 3001 端口已释放"')

# 2. git pull（先修复 .git 权限，用 admin 用户）
print("\n===== 2/6 拉取最新代码 =====")
run(ssh, 'chown -R admin:admin /www/ming8/.git 2>/dev/null; chmod -R u+rwX /www/ming8/.git 2>/dev/null; git config --global --add safe.directory /www/ming8 2>/dev/null; su - admin -c "cd /www/ming8 && git config --global --add safe.directory /www/ming8 && git pull origin main" 2>&1')

# 3. mysql init
print("\n===== 3/6 初始化数据库 =====")
run(ssh, "mysql -u ming8 -p'Ming8@2026!' ming8_db < /www/ming8/scripts/mysql-init.sql 2>&1 | grep -v 'Using a password' | tail -5")

# 4. 上传构建产物
print("\n===== 4/6 上传构建产物 (223MB) =====")
file_size = os.path.getsize(LOCAL_ZIP)
print(f"文件大小: {file_size / 1024 / 1024:.1f} MB")
sftp = ssh.open_sftp()
last_print = [0]
def callback(transferred, total):
    now = time.time()
    if now - last_print[0] > 2:
        if total > 0:
            percent = transferred / total * 100
            speed = transferred / 1024 / 1024 / max(now - start_time[0], 1)
            print(f"\r  进度: {percent:.1f}% ({transferred//1024//1024}MB/{total//1024//1024}MB, {speed:.1f} MB/s)", end='', flush=True)
        else:
            print(f"\r  已上传 {transferred//1024//1024}MB", end='', flush=True)
        last_print[0] = now
start_time = [time.time()]
with open(LOCAL_ZIP, 'rb') as f:
    sftp.putfo(f, REMOTE_ZIP, callback=callback)
print(f"\n  上传完成 ({time.time()-start_time[0]:.0f}s)")
sftp.close()

# 5. 解压
print("\n===== 5/6 解压构建产物 =====")
run(ssh, 'which unzip >/dev/null 2>&1 || apt install -y unzip 2>&1 | tail -1')
run(ssh, 'cd /www/ming8 && rm -rf .next && unzip -qo next-build.zip && rm -f next-build.zip && echo "解压完成"')

# 6. 启动服务（统一用 admin 实例；root 实例配置已删除不会再抢占）
print("\n===== 6/6 启动服务 =====")
run(ssh, 'pm2 delete ming8 2>/dev/null; su - admin -c "cd /www/ming8 && pm2 start deploy/ecosystem.config.js" 2>&1')
run(ssh, 'su - admin -c "pm2 save" 2>/dev/null; pm2 delete ming8 2>/dev/null; pm2 save 2>/dev/null; echo "PM2 已保存（仅 admin 实例）"')

# 7. 记录更新日志（UpdateLog 表）
record_deploy_log(ssh)

# 验证
print("\n===== 验证 =====")
time.sleep(5)
run(ssh, 'curl -s -o /dev/null -w "HTTP状态码: %{http_code}\\n" http://localhost:3001')
run(ssh, 'su - admin -c "pm2 status" 2>/dev/null || pm2 status')
run(ssh, 'free -h')

ssh.close()
print("\n===== 部署完成 =====")
