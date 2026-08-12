"""验证所有关键 API"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'
PORT = 3001

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def test(name, path, method='GET', data=None, cookie=None):
    cmd = f'curl -s -o /dev/null -w "%{{http_code}}" --max-time 15 http://localhost:{PORT}{path}'
    if method == 'POST' and data:
        cmd = f'curl -s -o /dev/null -w "%{{http_code}}" --max-time 15 -X POST -H "Content-Type: application/json" -d \'{data}\' http://localhost:{PORT}{path}'
    if cookie:
        cmd += f' -b "{cookie}"'
    _, stdout, _ = ssh.exec_command(cmd, get_pty=True)
    code = stdout.read().decode().strip()[-3:]
    icon = '✓' if code == '200' else '✗'
    print(f'  {icon} {name}: {code}')
    return code == '200'

# 公开 API
print('=== 公开 API ===')
test('首页', '/')
test('充值套餐 GET', '/api/user/recharge')

# 代理商登录
print('\n=== 代理商登录 ===')
_, stdout, _ = ssh.exec_command(f'curl -s -c /tmp/ac.txt -X POST -H "Content-Type: application/json" -d \'{{"email":"test_source@ming8.com","password":"Test@2026"}}\' http://localhost:{PORT}/api/auth/login', get_pty=True)
print(f'  登录响应: {stdout.read().decode()[:200]}')

print('\n=== 代理商 API ===')
agent_apis = [
    ('数据概览', '/api/agent/stats'),
    ('收益看板', '/api/agent/dashboard'),
    ('授权信息', '/api/agent/license'),
    ('我的订单', '/api/agent/agent-orders'),
    ('分润明细', '/api/agent/commissions?pageSize=1'),
    ('结算中心', '/api/agent/settlements'),
    ('客户管理', '/api/agent/customers'),
    ('代理设置', '/api/agent/settings'),
]
for name, path in agent_apis:
    test(name, path, cookie='/tmp/ac.txt')

# 管理员登录
print('\n=== 管理员登录 ===')
_, stdout, _ = ssh.exec_command(f'curl -s -c /tmp/ad.txt -X POST -H "Content-Type: application/json" -d \'{{"email":"282063152@qq.com","password":"admin123"}}\' http://localhost:{PORT}/api/auth/login', get_pty=True)
print(f'  登录响应: {stdout.read().decode()[:150]}')

print('\n=== 管理后台 API ===')
admin_apis = [
    ('admin/agent-stats', '/api/admin/agent-stats'),
    ('admin/agents', '/api/admin/agents'),
    ('admin/agent-settlement', '/api/admin/agent-settlement'),
    ('admin/commission-records', '/api/admin/commission-records?pageSize=1'),
    ('admin/licenses', '/api/admin/licenses?pageSize=1'),
]
for name, path in admin_apis:
    test(name, path, cookie='/tmp/ad.txt')

# 检查 license API 错误日志（关键 - 之前有 bug）
print('\n=== license API 详细测试 ===')
_, stdout, _ = ssh.exec_command(f'curl -s -b /tmp/ad.txt --max-time 15 http://localhost:{PORT}/api/admin/licenses?pageSize=1', get_pty=True)
print(f'  licenses 响应: {stdout.read().decode()[:400]}')

# 清理
ssh.exec_command('rm -f /tmp/ac.txt /tmp/ad.txt')

# 最近错误日志
print('\n=== 最近5分钟错误日志 ===')
_, stdout, _ = ssh.exec_command('su - admin -c "pm2 logs ming8 --lines 20 --nostream --err" 2>&1 | tail -15', get_pty=True)
print(stdout.read().decode().rstrip())

ssh.close()
