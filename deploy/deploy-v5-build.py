"""直接在服务器上构建 - 使用 setsid 完全脱离终端"""
import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=60):
    print(f"\n>>> {cmd[:200]}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode(errors='replace')
    if out: print(out.strip()[:3000])
    return out.strip()

# 启动构建（完全后台运行）
print("=" * 60)
print("启动构建（后台运行）")
print("=" * 60)
# 用 setsid + bash -c 完全脱离终端
run('rm -f /tmp/build.log /tmp/build.done')
run('setsid bash -c \'cd /www/ming8 && NODE_OPTIONS="--max-old-space-size=768" su - admin -c "cd /www/ming8 && NODE_OPTIONS=\\\"--max-old-space-size=768\\\" npx next build" > /tmp/build.log 2>&1; touch /tmp/build.done\' < /dev/null &')
time.sleep(3)

# 确认构建已启动
print("\n确认构建进程已启动...")
run('ps aux | grep "next build" | grep -v grep | head -3')

# 轮询构建状态
print("\n等待构建完成（最多15分钟）...")
build_done = False
for i in range(30):
    time.sleep(30)
    
    # 检查 /tmp/build.done 是否存在
    _, stdout, _ = ssh.exec_command('test -f /tmp/build.done && echo "DONE" || echo "RUNNING"')
    status = stdout.read().decode(errors='replace').strip()
    
    # 获取最新日志
    _, stdout, _ = ssh.exec_command('tail -3 /tmp/build.log 2>/dev/null')
    log = stdout.read().decode(errors='replace').strip()
    print(f"  [{(i+1)*30}s] {status} - {log[-200:]}")
    
    if status == 'DONE':
        build_done = True
        print(f"\n✓ 构建已完成！")
        break

if not build_done:
    print("\n⚠ 构建超时，检查日志...")
    run('tail -50 /tmp/build.log')
    # 检查是否实际完成
    _, stdout, _ = ssh.exec_command('stat -c "%Y" /www/ming8/.next/BUILD_ID 2>/dev/null')
    mtime = stdout.read().decode(errors='replace').strip()
    _, stdout, _ = ssh.exec_command('date +%s')
    now_ts = stdout.read().decode(errors='replace').strip()
    try:
        if mtime and int(now_ts) - int(mtime) < 300:
            print(f"\n✓ BUILD_ID 在5分钟内更新，构建实际已完成")
            build_done = True
    except: pass

# 显示构建结果
if build_done:
    print("\n构建日志（最后30行）:")
    run('tail -30 /tmp/build.log')

# 重启 PM2
print("\n" + "=" * 60)
print("重启 PM2")
print("=" * 60)
run('su - admin -c "pm2 restart ming8" 2>/dev/null')
time.sleep(8)

# 验证
print("\n" + "=" * 60)
print("验证服务")
print("=" * 60)
run('curl -s -o /dev/null -w "首页 HTTP: %{http_code}" --max-time 30 http://localhost:3001')

# 测试关键API
print("\n测试关键API:")
run('curl -s -c /tmp/ac.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\' | head -c 100')

test_apis = [
    ('stats', '/api/agent/stats'),
    ('agent-orders', '/api/agent/agent-orders'),
    ('commissions', '/api/agent/commissions?pageSize=1'),
    ('settlements', '/api/agent/settlements'),
    ('agent-settlements', '/api/agent/agent-settlements'),
    ('dashboard', '/api/agent/dashboard'),
    ('license', '/api/agent/license'),
]
all_pass = True
for name, path in test_apis:
    out = run(f'curl -s -b /tmp/ac.txt -o /dev/null -w "%{{http_code}}" http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    icon = '✓' if code == '200' else '✗'
    if code != '200':
        all_pass = False
        run(f'curl -s -b /tmp/ac.txt http://localhost:3001{path} | head -c 200')
    print(f"  {icon} {name}: HTTP {code}")

# 管理后台
print("\n--- 管理后台 ---")
run('curl -s -c /tmp/ad.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"282063152@qq.com","password":"admin123"}\' | head -c 100')
for name, path in [('agent-stats', '/api/admin/agent-stats'), ('agent-settlement', '/api/admin/agent-settlement'), ('commission-records', '/api/admin/commission-records?pageSize=1')]:
    out = run(f'curl -s -b /tmp/ad.txt -o /dev/null -w "%{{http_code}}" http://localhost:3001{path}')
    code = out.strip().split('\n')[-1].strip()
    icon = '✓' if code == '200' else '✗'
    if code != '200':
        all_pass = False
        run(f'curl -s -b /tmp/ad.txt http://localhost:3001{path} | head -c 200')
    print(f"  {icon} {name}: HTTP {code}")

run('rm -f /tmp/ac.txt /tmp/ad.txt /tmp/build.log /tmp/build.done')

# 错误日志
print("\n错误日志:")
run('su - admin -c "pm2 logs ming8 --lines 5 --nostream --err" 2>/dev/null | tail -10')

ssh.close()
print("\n" + "=" * 60)
print(f"{'✓ 全部通过' if all_pass else '✗ 部分失败'}")
print("=" * 60)
