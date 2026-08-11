"""
通过 Cloudflare API 加 *.ming8.online 泛解析 A 记录
"""
import os
import json
import urllib.request

TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN', '')
ZONE_ID = 'dd69eeb143f2450d93d13792e3b238c1'
SERVER_IP = '47.82.116.220'

def cf_api(method, path, data=None):
    url = f'https://api.cloudflare.com/client/v4{path}'
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    }
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode('utf-8'))

# 1. 验证 token
print("===== 1. 验证 Token =====")
r = cf_api('GET', '/user/tokens/verify')
if r.get('success'):
    print(f"  Token 有效: {r['result']['status']}")
else:
    print(f"  Token 无效: {r}")
    exit(1)

# 2. 列出现有 A 记录
print("\n===== 2. 现有 A 记录 =====")
r = cf_api('GET', f'/zones/{ZONE_ID}/dns_records?type=A')
if r.get('success'):
    for rec in r['result']:
        print(f"  {rec['name']} -> {rec['content']} (proxied={rec['proxied']})")
else:
    print(f"  获取失败: {r}")
    # 尝试列出所有记录（不限类型）
    print("\n  尝试列出所有记录...")
    r2 = cf_api('GET', f'/zones/{ZONE_ID}/dns_records')
    if r2.get('success'):
        for rec in r2['result']:
            print(f"  {rec['type']:6s} {rec['name']} -> {rec['content']} (proxied={rec['proxied']})")
    else:
        print(f"  也失败: {r2}")
        # token 权限不足，需要提示用户
        print("\n  Token 权限不足，无法管理 DNS 记录")
        print("  需要在 CF 后台创建一个包含 Zone.DNS 编辑权限的 token")
        exit(1)

# 3. 检查是否已有 *.ming8.online 记录
print("\n===== 3. 检查是否已有泛解析记录 =====")
existing = False
if r.get('success'):
    for rec in r['result']:
        if rec['name'] == '*.ming8.online':
            existing = True
            print(f"  已存在: {rec['name']} -> {rec['content']} (proxied={rec['proxied']})")
            break
if not existing:
    print("  不存在，需要创建")

# 4. 创建 *.ming8.online A 记录
if not existing:
    print("\n===== 4. 创建 *.ming8.online A 记录 =====")
    data = {
        'type': 'A',
        'name': '*.ming8.online',
        'content': SERVER_IP,
        'proxied': False,  # DNS only，直连服务器，国内访问快
        'ttl': 1  # Auto
    }
    r = cf_api('POST', f'/zones/{ZONE_ID}/dns_records', data)
    if r.get('success'):
        print(f"  ✓ 创建成功: {r['result']['name']} -> {r['result']['content']}")
    else:
        print(f"  ✗ 创建失败: {r}")
else:
    print("\n  泛解析记录已存在，跳过创建")

print("\n===== 完成 =====")
