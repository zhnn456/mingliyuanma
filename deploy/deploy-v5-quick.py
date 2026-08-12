"""部署V5.1: 解决git冲突 + 部署 + 测试"""
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

# Step 1: 清理冲突文件 + git stash + git pull
print("=" * 60)
print("Step 1: 清理冲突并 Git Pull")
print("=" * 60)
run('cd /www/ming8 && rm -f public/images/knowledge/categories/*.jpg public/images/knowledge/categories/*.svg')
run('cd /www/ming8 && git stash')
run('cd /www/ming8 && git checkout -- .')
run('cd /www/ming8 && git pull origin main 2>&1')

# Step 2: 安装依赖（用root）
print("\n" + "=" * 60)
print("Step 2: 安装依赖")
print("=" * 60)
run('cd /www/ming8 && npm install --legacy-peer-deps --no-audit --no-fund 2>&1 | tail -3', timeout=180)

# Step 3: 构建
print("\n" + "=" * 60)
print("Step 3: 构建 (Next.js)")
print("=" * 60)
print("构建中... 这可能需要5-8分钟，请耐心等待...")
# 用 nohup 后台构建，然后轮询状态
run('cd /www/ming8 && rm -f /tmp/build.log && nohup bash -c \'cd /www/ming8 && NODE_OPTIONS="--max-old-space-size=768" su - admin -c "cd /www/ming8 && NODE_OPTIONS=\\"--max-old-space-size=768\\" npx next build" > /tmp/build.log 2>&1\' &')

# 轮询构建状态
print("等待构建完成...")
for i in range(30):  # 最多等待15分钟
    time.sleep(30)
    out, _ = ssh.exec_command('tail -5 /tmp/build.log 2>/dev/null')
    log = out.read().decode(errors='replace').strip()
    print(f"  [{(i+1)*30}s] {log[-300:]}")
    
    # 检查是否完成
    out, _ = ssh.exec_command('ls -la /www/ming8/.next/BUILD_ID 2>/dev/null && echo "BUILD_DONE" || echo "STILL_BUILDING"')
    status = out.read().decode(errors='replace').strip()
    if 'BUILD_DONE' in status:
        # 检查 BUILD_ID 的时间戳是否是新的
        out, _ = ssh.exec_command('stat -c "%Y" /www/ming8/.next/BUILD_ID 2>/dev/null')
        mtime = out.read().decode(errors='replace').strip()
        out, _ = ssh.exec_command('date +%s')
        now_ts = out.read().decode(errors='replace').strip()
        try:
            if int(now_ts) - int(mtime) < 60:
                print(f"\n✓ 构建完成！BUILD_ID 刚刚生成")
                break
            else:
                # BUILD_ID 是旧的，继续等待
                print(f"  BUILD_ID 存在但可能旧的 ({mtime} vs {now_ts})，继续等待...")
        except:
            print(f"\n✓ 构建完成！")
            break
else:
    print("\n⚠ 等待超时，检查构建日志...")
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

# 登录代理商
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

# 清理
run('rm -f /tmp/agent_cookies.txt /tmp/admin_cookies.txt')

# 查看错误日志
print("\n" + "=" * 60)
print("错误日志")
print("=" * 60)
run('su - admin -c "pm2 logs ming8 --lines 10 --nostream --err" 2>/dev/null | tail -15')

ssh.close()

print("\n" + "=" * 60)
print(f"{'✓ 全部通过' if all_pass else '✗ 部分失败，请查看上方日志'}")
print("=" * 60)
