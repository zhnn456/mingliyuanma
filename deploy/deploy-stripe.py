"""部署Stripe集成 + 配置服务器密钥
用法：先设置环境变量 STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY，再运行本脚本
"""
import paramiko, time, os

# 从环境变量读取 Stripe 密钥，不硬编码在代码中（避免密钥泄露）
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
if not STRIPE_SECRET_KEY or not STRIPE_PUBLISHABLE_KEY:
    print('❌ 请先设置环境变量：STRIPE_SECRET_KEY 和 STRIPE_PUBLISHABLE_KEY')
    print('   PowerShell: $env:STRIPE_SECRET_KEY="sk_live_xxx"; $env:STRIPE_PUBLISHABLE_KEY="pk_live_xxx"')
    exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=600):
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    stdout.channel.settimeout(timeout)
    try:
        out = stdout.read().decode()
    except:
        out = '(timeout, command may still be running)'
    code = stdout.channel.recv_exit_status()
    if out: print(out[:2000])
    print(f'[exit: {code}]')
    return code

# 1. 配置Stripe密钥到.env.production
print('=== 配置Stripe密钥 ===')
run(f'grep -q STRIPE_SECRET_KEY /www/ming8/.env.production && echo "Stripe配置已存在" || echo "\\n# Stripe 支付\\nSTRIPE_PUBLISHABLE_KEY={STRIPE_PUBLISHABLE_KEY}\\nSTRIPE_SECRET_KEY={STRIPE_SECRET_KEY}\\nSTRIPE_WEBHOOK_SECRET=" >> /www/ming8/.env.production')

# 2. 拉取代码
print('\n=== 拉取代码 ===')
run('cd /www/ming8 && git checkout -- src/lib/version.ts scripts/test-payment-concurrency.js 2>&1 || true')
run('cd /www/ming8 && git pull 2>&1')

# 3. 构建
print('\n=== 构建 ===')
run('cd /www/ming8 && NODE_OPTIONS="--max-old-space-size=1024" npm run build:server 2>&1 | tail -5', timeout=600)

# 4. 重启
print('\n=== 重启PM2 ===')
run('pm2 delete ming8 2>/dev/null; cd /www/ming8 && PORT=3001 pm2 start npm --name ming8 -- start 2>&1')

# 5. 验证
print('\n=== 验证 ===')
time.sleep(8)
run('curl -s http://localhost:3001/api/health')

ssh.close()
print('\n✅ Stripe集成部署完成')
