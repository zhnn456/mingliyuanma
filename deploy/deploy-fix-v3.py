"""快速部署修复后的代码"""
import paramiko, os, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'
LOCAL_ZIP = r'f:\mingliyuanma\next-build-v3.zip'
REMOTE_ZIP = '/www/ming8/next-build-v3.zip'

def run(ssh, cmd, timeout=120):
    print(f"\n>>> {cmd[:150]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    if out: print(out.strip()[:3000])
    if err and 'Using a password' not in err and 'Warning' not in err:
        print(f"[stderr] {err.strip()[:1000]}")
    return out

# 修改build-zip输出文件名
import subprocess
# 重新打包到新文件名
os.environ['OUT_NAME'] = 'next-build-v3'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

# 上传
file_size = os.path.getsize(r'f:\mingliyuanma\next-build-v2.zip')
print(f"\n本地文件: {file_size/1024/1024:.1f}MB")

# 重命名本地文件
import shutil
if not os.path.exists(LOCAL_ZIP):
    shutil.copy(r'f:\mingliyuanma\next-build-v2.zip', LOCAL_ZIP)
file_size = os.path.getsize(LOCAL_ZIP)

print(f"上传 {file_size/1024/1024:.1f}MB...")
sftp = ssh.open_sftp()
start = time.time()
with open(LOCAL_ZIP, 'rb') as f:
    sftp.putfo(f, REMOTE_ZIP)
print(f"上传完成 ({time.time()-start:.0f}s)")
sftp.close()

# 解压
print("\n解压...")
run(ssh, 'rm -rf /www/ming8/.next')
run(ssh, 'cd /www/ming8 && unzip -qo next-build-v3.zip && rm -f next-build-v3.zip')
run(ssh, 'ls /www/ming8/.next/BUILD_ID')

# 修复权限
run(ssh, 'chown -R admin:admin /www/ming8/.next /www/ming8/public')

# 重启 PM2
print("\n重启服务...")
run(ssh, 'su - admin -c "pm2 restart ming8" 2>/dev/null')
time.sleep(5)

# 验证
print("\n验证服务...")
run(ssh, 'curl -s -o /dev/null -w "HTTP: %{http_code}\\n" --max-time 30 http://localhost:3001')

# 测试 admin/agent-stats API
print("\n测试 admin/agent-stats API...")
run(ssh, 'curl -s -c /tmp/admin_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"admin@ming8.online","password":"Admin@2026!"}\' > /dev/null')
run(ssh, 'curl -s -b /tmp/admin_cookies.txt http://localhost:3001/api/admin/agent-stats | head -c 300')

# 测试 agent/license API
print("\n测试 agent/license API...")
run(ssh, 'curl -s -c /tmp/agent_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\' > /dev/null')
run(ssh, 'curl -s -b /tmp/agent_cookies.txt http://localhost:3001/api/agent/license | head -c 300')

# 测试 agent/stats API
print("\n测试 agent/stats API...")
run(ssh, 'curl -s -b /tmp/agent_cookies.txt http://localhost:3001/api/agent/stats | head -c 300')

# 清理
run(ssh, 'rm -f /tmp/admin_cookies.txt /tmp/agent_cookies.txt')

ssh.close()
print("\n✓ 部署完成")
