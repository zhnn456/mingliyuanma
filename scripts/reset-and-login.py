"""重置管理员密码并登录测试"""
import paramiko, sys, requests, json
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return out, err

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618',
            look_for_keys=False, allow_agent=False, timeout=30)

# 1. 在服务器上用 Node.js 生成密码哈希
print('=== 1. 生成密码哈希 ===')
node_cmd = "cd /www/ming8 && node -e 'const c=require(\"crypto\");const p=\"Admin@2026!\";const s=c.randomBytes(16);const k=c.pbkdf2Sync(p,s,100000,32,\"sha256\");console.log(\"pbkdf2_100000$\"+s.toString(\"base64\")+\"$\"+Buffer.from(k).toString(\"base64\"))'"
out, err = run(ssh, node_cmd)
password_hash = out.strip()
print('  哈希:', password_hash[:80], '...')
if err:
    print('  错误:', err[:200])

if not password_hash or not password_hash.startswith('pbkdf2'):
    print('  生成失败，退出')
    ssh.close()
    sys.exit(1)

# 2. 更新管理员密码
print('\n=== 2. 更新管理员密码 ===')
# 写入临时文件避免转义问题
update_cmd = """cat > /tmp/reset_pwd.sql << 'SQLEOF'
UPDATE User SET passwordHash='%s' WHERE email='282063152@qq.com';
SQLEOF
mysql -u ming8 -p'Ming8@2026!' ming8_db < /tmp/reset_pwd.sql 2>/dev/null && echo "OK"
""" % password_hash

out, err = run(ssh, update_cmd)
print('  结果:', out)
if err:
    print('  错误:', err[:200])

# 验证
out, err = run(ssh, """mysql -u ming8 -p'Ming8@2026!' ming8_db -e "SELECT email, LEFT(passwordHash, 20) as hash_prefix FROM User WHERE email='282063152@qq.com'" 2>/dev/null""")
print('  验证:', out)

ssh.close()

# 3. 用 API 登录测试
print('\n=== 3. 登录测试 ===')
login_data = {
    'email': '282063152@qq.com',
    'password': 'Admin@2026!',
}

for site_name, base_url in [('中央站', 'https://ming8.online'), ('源码站', 'https://bazi6.cc.cd')]:
    print('\n--- %s: %s ---' % (site_name, base_url))
    try:
        s = requests.Session()
        res = s.post(base_url + '/api/auth/login', json=login_data, timeout=15, allow_redirects=False)
        print('  状态码:', res.status_code)
        cookies = res.headers.get('Set-Cookie', '')
        print('  Set-Cookie:', cookies[:120])
        try:
            data = res.json()
            print('  响应:', json.dumps(data, ensure_ascii=False)[:200])
        except:
            print('  响应文本:', res.text[:200])

        # 如果登录成功，测试 API
        if res.status_code == 200:
            print('\n  === 测试 API ===')
            apis = [
                ('stats', 'GET', '/api/admin/stats'),
                ('users', 'GET', '/api/admin/users'),
                ('orders', 'GET', '/api/admin/orders'),
                ('config', 'GET', '/api/admin/config'),
                ('payment-config', 'GET', '/api/admin/payment-config'),
                ('coupons', 'GET', '/api/admin/coupons'),
                ('plans', 'GET', '/api/admin/plans'),
                ('announcement', 'GET', '/api/admin/announcement'),
                ('brands', 'GET', '/api/admin/brand-settings'),
                ('agents', 'GET', '/api/admin/agents'),
                ('card-keys', 'GET', '/api/admin/card-keys'),
                ('audit', 'GET', '/api/admin/audit'),
            ]
            for name, method, path in apis:
                try:
                    r = s.get(base_url + path, timeout=10)
                    status = r.status_code
                    try:
                        d = r.json()
                        if isinstance(d, list):
                            info = 'list[%d]' % len(d)
                        elif isinstance(d, dict):
                            keys = list(d.keys())[:3]
                            info = 'keys=' + str(keys)
                        else:
                            info = str(d)[:50]
                    except:
                        info = r.text[:50]
                    icon = '✅' if status == 200 else '❌'
                    print('    %s %d %s %s' % (icon, status, path, info))
                except Exception as e:
                    print('    ❌ ERR %s %s' % (path, str(e)[:50]))
    except Exception as e:
        print('  错误:', e)

print('\n=== 完成 ===')
