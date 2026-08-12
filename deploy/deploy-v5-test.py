"""检查构建状态 + 重启 + 测试"""
import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=300):
    print(f"\n>>> {cmd[:200]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode(errors='replace')
    if out: print(out.strip()[:3000])
    return out.strip()

# 检查构建日志（构建可能已在运行）
print("=" * 60)
print("检查构建日志")
print("=" * 60)
run('ls -la /tmp/build.log 2>/dev/null && tail -10 /tmp/build.log 2>/dev/null')

# 检查是否还在构建
print("\n检查构建进程是否还在运行...")
run('ps aux | grep "next build" | grep -v grep')

# 等待构建完成（最多15分钟）
print("\n等待构建完成...")
for i in range(30):
    time.sleep(30)
    _, stdout, _ = ssh.exec_command('tail -3 /tmp/build.log 2>/dev/null')
    log = stdout.read().decode(errors='replace').strip()
    print(f"  [{(i+1)*30}s] {log[-200:]}")
    
    # 检查 BUILD_ID 是否刚刚更新
    _, stdout, _ = ssh.exec_command('stat -c "%Y" /www/ming8/.next/BUILD_ID 2>/dev/null')
    mtime = stdout.read().decode(errors='replace').strip()
    _, stdout, _ = ssh.exec_command('date +%s')
    now_ts = stdout.read().decode(errors='replace').strip()
    try:
        if mtime and now_ts and int(now_ts) - int(mtime) < 90:
            print(f"\n✓ 构建完成！BUILD_ID 刚刚生成")
            break
    except: pass
    
    # 检查构建进程是否还在
    _, stdout, _ = ssh.exec_command('ps aux | grep "next build" | grep -v grep | wc -l')
    cnt = stdout.read().decode(errors='replace').strip()
    if cnt == '0' and i > 0:
        # 进程已退出，再等一次确认
        time.sleep(5)
        _, stdout, _ = ssh.exec_command('stat -c "%Y" /www/ming8/.next/BUILD_ID 2>/dev/null')
        mtime2 = stdout.read().decode(errors='replace').strip()
        _, stdout, _ = ssh.exec_command('date +%s')
        now_ts2 = stdout.read().decode(errors='replace').strip()
        try:
            if int(now_ts2) - int(mtime2) < 120:
                print(f"\n✓ 构建进程已退出，BUILD_ID 已更新")
                break
            else:
                print(f"\n⚠ 构建进程已退出但 BUILD_ID 未更新，检查日志...")
                run('tail -30 /tmp/build.log')
                break
        except:
            break
else:
    print("\n⚠ 等待超时")
    run('tail -30 /tmp/build.log')

# Step 4: 重启 PM2
print("\n" + "=" * 60)
print("Step 4: 重启 PM2")
print("=" * 60)
run('su - admin -c "pm2 restart ming8" 2>/dev/null')
print("等待8秒...")
time.sleep(8)

# Step 5: 验证服务
print("\n" + "=" * 60)
print("Step 5: 验证服务启动")
print("=" * 60)
run('curl -s -o /dev/null -w "首页 HTTP: %{http_code}" --max-time 30 http://localhost:3001')

# Step 6: 测试所有代理商API
print("\n" + "=" * 60)
print("Step 6: 测试代理商API")
print("=" * 60)

run('curl -s -c /tmp/agent_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\' | head -c 200')

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
    out = run(f'curl -s -b /tmp/agent_cookies.txt -o /dev/null -w "%{{http_code}}" http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    icon = '✓' if code == '200' else '✗'
    if code != '200':
        all_pass = False
        run(f'curl -s -b /tmp/agent_cookies.txt http://localhost:3001{path} | head -c 300')
    print(f"  {icon} {name}: HTTP {code}")

# 管理后台API
print("\n--- 管理后台 API ---")
run('curl -s -c /tmp/admin_cookies.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"282063152@qq.com","password":"admin123"}\' | head -c 200')

admin_apis = [
    ('admin/agent-stats', '/api/admin/agent-stats'),
    ('admin/agents', '/api/admin/agents'),
    ('admin/agent-review', '/api/admin/agent-review'),
    ('admin/agent-settlement', '/api/admin/agent-settlement'),
    ('admin/commission-records', '/api/admin/commission-records?pageSize=1'),
]
for name, path in admin_apis:
    out = run(f'curl -s -b /tmp/admin_cookies.txt -o /dev/null -w "%{{http_code}}" http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    icon = '✓' if code == '200' else '✗'
    if code != '200':
        all_pass = False
        run(f'curl -s -b /tmp/admin_cookies.txt http://localhost:3001{path} | head -c 300')
    print(f"  {icon} {name}: HTTP {code}")

run('rm -f /tmp/agent_cookies.txt /tmp/admin_cookies.txt')

print("\n" + "=" * 60)
print("错误日志（最后10条）")
print("=" * 60)
run('su - admin -c "pm2 logs ming8 --lines 10 --nostream --err" 2>/dev/null | tail -15')

ssh.close()

print("\n" + "=" * 60)
print(f"{'✓ 全部通过' if all_pass else '✗ 部分失败，请查看上方日志'}")
print("=" * 60)
