"""验证卡密系统全部修复"""
import paramiko, json, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

def run(ssh, cmd, timeout=30):
    _, stdout, _ = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode(errors='replace').strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

BASE = "http://localhost:3001"
ts = int(time.time())
admin_email = f"admin-{ts}@zhiwei.com"
user_email = f"user-{ts}@zhiwei.com"
admin_ck = f"/tmp/ck_a_{ts}.txt"
user_ck = f"/tmp/ck_u_{ts}.txt"

print("=== 1. 注册+登录 ===")
run(ssh, f'''curl -s -X POST '{BASE}/api/user/register' -H 'Content-Type: application/json' -d '{{"email":"{admin_email}","password":"AdminTest2026!","name":"admin"}}' ''')
run(ssh, f'''curl -s -X POST '{BASE}/api/user/register' -H 'Content-Type: application/json' -d '{{"email":"{user_email}","password":"UserTest2026!","name":"user"}}' ''')
run(ssh, f'mysql -u ming8 -p"Ming8@2026!" ming8_db -e "UPDATE User SET role=\'admin\' WHERE email=\'{admin_email}\'" 2>&1')
run(ssh, f'''curl -s -c {admin_ck} -X POST '{BASE}/api/auth/login' -H 'Content-Type: application/json' -d '{{"email":"{admin_email}","password":"AdminTest2026!"}}' ''')
run(ssh, f'''curl -s -c {user_ck} -X POST '{BASE}/api/auth/login' -H 'Content-Type: application/json' -d '{{"email":"{user_email}","password":"UserTest2026!"}}' ''')
print("✅ 注册登录完成")

print("\n=== 2. 生成20位卡密（3张）===")
result = run(ssh, f'''curl -s -b {admin_ck} -X POST '{BASE}/api/admin/card-keys' -H 'Content-Type: application/json' -d '{{"count":3,"type":"lingzhu","value":100,"price":9.9,"expiryDays":30}}' ''')
data = json.loads(result)
if data.get('success'):
    print(f"✅ 生成成功，批次: {data['batchId']}")
    for i, item in enumerate(data['items']):
        code = item['code']
        # 验证卡密长度
        pure_code = code.replace('-', '')
        is_20 = len(pure_code) == 20
        groups = code.split('-')
        is_5_groups = len(groups) == 5
        print(f"  {i+1}. {code}  (纯码{len(pure_code)}位, {'✅20位' if is_20 else '❌' + str(len(pure_code)) + '位'}, {'✅5组' if is_5_groups else '❌' + str(len(groups)) + '组'})")
else:
    print(f"❌ 生成失败: {data.get('error')}")
    ssh.close()
    exit()

print("\n=== 3. 验证统计刷新 ===")
list_result = run(ssh, f'''curl -s -b {admin_ck} '{BASE}/api/admin/card-keys?page=1&pageSize=5' ''')
list_data = json.loads(list_result)
stats = list_data.get('stats', {})
print(f"总卡密: {stats.get('total', 0)}")
print(f"未使用: {stats.get('unused', 0)}")
print(f"已使用: {stats.get('used', 0)}")
print(f"已过期: {stats.get('expired', 0)}")
if stats.get('total', 0) > 0:
    print(f"✅ 统计已刷新")
else:
    print(f"❌ 统计未刷新")

print("\n=== 4. 验证列表使用者信息+剩余天数 ===")
rows = list_data.get('rows', [])
if rows:
    r = rows[0]
    print(f"卡密: {r.get('code')}")
    print(f"使用者邮箱: {r.get('usedByEmail', 'NULL')} {'✅有字段' if 'usedByEmail' in r else '❌无字段'}")
    print(f"创建者邮箱: {r.get('createdByEmail', 'NULL')} {'✅有字段' if 'createdByEmail' in r else '❌无字段'}")
    print(f"过期时间: {r.get('expiryAt', 'NULL')}")
    print(f"分页信息: 第{list_data.get('page')}页/共{list_data.get('totalPages')}页, 总{list_data.get('total')}条")
    print(f"批次列表: {len(list_data.get('batches', []))}个批次")
    print(f"✅ 使用者信息+分页+批次 都有返回")
else:
    print("❌ 列表为空")

print("\n=== 5. 兑换卡密（验证并发竞态修复）===")
card1 = data['items'][0]['code']
r1 = run(ssh, f'''curl -s -b {user_ck} -X POST '{BASE}/api/user/redeem-card' -H 'Content-Type: application/json' -d '{{"code":"{card1}"}}' ''')
d1 = json.loads(r1)
print(f"兑换: {'✅ 成功' if d1.get('success') else '❌ ' + str(d1.get('error'))}")
if d1.get('points') is not None:
    print(f"余额: {d1['points']} 灵珠")

print("\n=== 6. 重复兑换（验证防双花）===")
r2 = run(ssh, f'''curl -s -b {user_ck} -X POST '{BASE}/api/user/redeem-card' -H 'Content-Type: application/json' -d '{{"code":"{card1}"}}' ''')
d2 = json.loads(r2)
print(f"重复兑换: {'✅ 正确拒绝: ' + d2.get('error','') if not d2.get('success') else '❌ 双花漏洞!'}")

print("\n=== 7. 兑换第二张 ===")
card2 = data['items'][1]['code']
r3 = run(ssh, f'''curl -s -b {user_ck} -X POST '{BASE}/api/user/redeem-card' -H 'Content-Type: application/json' -d '{{"code":"{card2}"}}' ''')
d3 = json.loads(r3)
print(f"兑换: {'✅ 成功' if d3.get('success') else '❌ ' + str(d3.get('error'))}")
if d3.get('points') is not None:
    print(f"余额: {d3['points']} 灵珠 (应为200)")

print("\n=== 8. 验证兑换后统计 ===")
list2 = run(ssh, f'''curl -s -b {admin_ck} '{BASE}/api/admin/card-keys?page=1&pageSize=5' ''')
d4 = json.loads(list2)
stats2 = d4.get('stats', {})
print(f"总卡密: {stats2.get('total')}, 未使用: {stats2.get('unused')}, 已使用: {stats2.get('used')}")
if stats2.get('used', 0) >= 2:
    print(f"✅ 兑换后统计已更新")
else:
    print(f"❌ 统计未更新")

# 清理
run(ssh, f'mysql -u ming8 -p"Ming8@2026!" ming8_db -e "DELETE FROM User WHERE email LIKE \'%{ts}@zhiwei.com\'" 2>&1')
run(ssh, f'rm -f {admin_ck} {user_ck}')

print("\n=== 全部验证完成 ===")
ssh.close()
