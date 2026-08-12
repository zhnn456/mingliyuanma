"""V5 最终部署：上传本地 .next 目录到服务器"""
import paramiko, os, time, zipfile, sys

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'
LOCAL_NEXT_DIR = r'f:\mingliyuanma\.next'
LOCAL_ZIP = r'f:\mingliyuanma\next-build-v6.zip'
REMOTE_ZIP = '/www/ming8/next-build-v6.zip'

# Step 1: 打包 .next 目录
print("=" * 60)
print("Step 1: 打包 .next 目录")
print("=" * 60)
if os.path.exists(LOCAL_ZIP):
    os.remove(LOCAL_ZIP)

# 统计文件数
file_count = 0
for root, dirs, files in os.walk(LOCAL_NEXT_DIR):
    file_count += len(files)
print(f"文件总数: {file_count}")

# 压缩
print("压缩中...")
start = time.time()
with zipfile.ZipFile(LOCAL_ZIP, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for root, dirs, files in os.walk(LOCAL_NEXT_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            arcname = os.path.relpath(full_path, os.path.dirname(LOCAL_NEXT_DIR))
            zf.write(full_path, arcname)

zip_size = os.path.getsize(LOCAL_ZIP)
print(f"✓ 压缩完成: {zip_size/1024/1024:.1f}MB, 耗时 {time.time()-start:.0f}s")

# Step 2: 上传
print("\n" + "=" * 60)
print("Step 2: 上传到服务器")
print("=" * 60)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=300):
    print(f"\n>>> {cmd[:200]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode(errors='replace')
    if out: print(out.strip()[:3000])
    return out.strip()

print(f"上传 {zip_size/1024/1024:.1f}MB...")
sftp = ssh.open_sftp()
start = time.time()
with open(LOCAL_ZIP, 'rb') as f:
    sftp.putfo(f, REMOTE_ZIP)
print(f"✓ 上传完成 ({time.time()-start:.0f}s)")
sftp.close()

# Step 3: 备份旧 .next 并解压新的
print("\n" + "=" * 60)
print("Step 3: 部署 .next")
print("=" * 60)
run('cd /www/ming8 && mv .next .next.bak 2>/dev/null; rm -rf .next')
run('cd /www/ming8 && unzip -qo next-build-v6.zip && rm -f next-build-v6.zip')
run('ls -la /www/ming8/.next/BUILD_ID')
run('chown -R admin:admin /www/ming8/.next')

# Step 4: 重启 PM2
print("\n" + "=" * 60)
print("Step 4: 重启 PM2")
print("=" * 60)
run('su - admin -c "pm2 restart ming8" 2>/dev/null')
print("等待8秒...")
time.sleep(8)

# Step 5: 验证
print("\n" + "=" * 60)
print("Step 5: 验证服务")
print("=" * 60)
run('curl -s -o /dev/null -w "首页 HTTP: %{http_code}" --max-time 30 http://localhost:3001')

# Step 6: 测试所有代理商API
print("\n" + "=" * 60)
print("Step 6: 测试所有代理商API")
print("=" * 60)

run('curl -s -c /tmp/ac.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\' | head -c 150')

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
    ('代理结算2 agent-settlements', '/api/agent/agent-settlements'),
]

all_pass = True
for name, path in apis:
    out = run(f'curl -s -b /tmp/ac.txt -o /dev/null -w "%{{http_code}}" http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    icon = '✓' if code == '200' else '✗'
    if code != '200':
        all_pass = False
        run(f'curl -s -b /tmp/ac.txt http://localhost:3001{path} | head -c 300')
    print(f"  {icon} {name}: HTTP {code}")

# 管理后台API
print("\n--- 管理后台 API ---")
run('curl -s -c /tmp/ad.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"282063152@qq.com","password":"admin123"}\' | head -c 150')

admin_apis = [
    ('admin/agent-stats', '/api/admin/agent-stats'),
    ('admin/agents', '/api/admin/agents'),
    ('admin/agent-review', '/api/admin/agent-review'),
    ('admin/agent-settlement', '/api/admin/agent-settlement'),
    ('admin/commission-records', '/api/admin/commission-records?pageSize=1'),
]
for name, path in admin_apis:
    out = run(f'curl -s -b /tmp/ad.txt -o /dev/null -w "%{{http_code}}" http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    icon = '✓' if code == '200' else '✗'
    if code != '200':
        all_pass = False
        run(f'curl -s -b /tmp/ad.txt http://localhost:3001{path} | head -c 300')
    print(f"  {icon} {name}: HTTP {code}")

run('rm -f /tmp/ac.txt /tmp/ad.txt')

# 清理备份
run('rm -rf /www/ming8/.next.bak')

# 错误日志
print("\n" + "=" * 60)
print("错误日志")
print("=" * 60)
run('su - admin -c "pm2 logs ming8 --lines 5 --nostream --err" 2>/dev/null | tail -10')

ssh.close()

# 清理本地 zip
os.remove(LOCAL_ZIP)

print("\n" + "=" * 60)
print(f"{'✓ 全部通过！代理商模块所有API正常工作' if all_pass else '✗ 部分失败，请查看上方日志'}")
print("=" * 60)
