"""部署修复并测试所有API"""
import paramiko, os, time, shutil

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'
LOCAL_ZIP = r'f:\mingliyuanma\next-build-v4.zip'
REMOTE_ZIP = '/www/ming8/next-build-v4.zip'

def run(ssh, cmd, timeout=120):
    print(f"\n>>> {cmd[:200]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    if out: print(out.strip()[:3000])
    if err and 'Using a password' not in err and 'Warning' not in err:
        print(f"[stderr] {err.strip()[:1500]}")
    return out

# 准备文件
shutil.copy(r'f:\mingliyuanma\next-build-v2.zip', LOCAL_ZIP)
file_size = os.path.getsize(LOCAL_ZIP)
print(f"文件大小: {file_size/1024/1024:.1f}MB")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

# 上传
print(f"\n上传 {file_size/1024/1024:.1f}MB...")
sftp = ssh.open_sftp()
start = time.time()
with open(LOCAL_ZIP, 'rb') as f:
    sftp.putfo(f, REMOTE_ZIP)
print(f"上传完成 ({time.time()-start:.0f}s)")
sftp.close()

# 解压
print("\n解压...")
run(ssh, 'rm -rf /www/ming8/.next')
run(ssh, 'cd /www/ming8 && unzip -qo next-build-v4.zip && rm -f next-build-v4.zip')
run(ssh, 'chown -R admin:admin /www/ming8/.next /www/ming8/public')

# 重启
print("\n重启服务...")
run(ssh, 'su - admin -c "pm2 restart ming8" 2>/dev/null')
time.sleep(5)

# 验证
print("\n验证服务...")
run(ssh, 'curl -s -o /dev/null -w "HTTP: %{http_code}" --max-time 30 http://localhost:3001')

# 测试所有API
print("\n" + "="*60)
print("测试所有代理商API")
print("="*60)

run(ssh, 'curl -s -c /tmp/agent_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\' > /dev/null')

apis = [
    ('数据概览 stats', '/api/agent/stats'),
    ('收益看板 dashboard', '/api/agent/dashboard'),
    ('授权信息 license', '/api/agent/license'),
    ('续费管理 renew', '/api/agent/renew'),
    ('技术工单 tickets', '/api/agent/tickets'),
    ('我的订单 agent-orders', '/api/agent/agent-orders'),
    ('分润明细 commissions', '/api/agent/commissions?pageSize=1'),
    ('结算中心 settlements', '/api/agent/settlements'),
    ('客户管理 customers', '/api/agent/customers'),
    ('代理设置 settings', '/api/agent/settings'),
]

all_pass = True
for name, path in apis:
    out = run(ssh, f'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "%{{http_code}}" http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    status = '✓' if code == '200' else '✗'
    if code != '200':
        all_pass = False
        # 获取错误信息
        err_out = run(ssh, f'curl -s -b /tmp/agent_cookies.txt http://localhost:3001{path} | head -c 300')
    print(f"  {status} {name}: HTTP {code}")

# 测试 admin/agent-stats
print("\n--- 管理后台 API ---")
run(ssh, 'curl -s -c /tmp/admin_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"282063152@qq.com","password":"Admin@2026!"}\' | head -c 200')
run(ssh, 'curl -s -b /tmp/admin_cookies.txt -o /dev/null -w "admin/agent-stats: HTTP %{http_code}" http://localhost:3001/api/admin/agent-stats')
run(ssh, 'curl -s -b /tmp/admin_cookies.txt -o /dev/null -w "admin/agents: HTTP %{http_code}" http://localhost:3001/api/admin/agents')

# 清理
run(ssh, 'rm -f /tmp/agent_cookies.txt /tmp/admin_cookies.txt')

ssh.close()
print("\n" + "="*60)
print(f"{'✓ 全部通过' if all_pass else '✗ 部分失败，请查看上方日志'}")
print("="*60)
