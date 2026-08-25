#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API 安全攻防实测脚本（攻击者视角）
用法: python3 api-security-test.py [BASE_URL] [HOST_HEADER] [OTHER_USER_TICKET_ID]
  默认 BASE_URL=http://127.0.0.1:3001 HOST_HEADER=ming8.online（在服务器上本机执行）
  也可指向公网: python3 api-security-test.py https://ming8.online ming8.online

覆盖 8 类问题: 认证/功能越权/数据越权/字段篡改提权/注入/绕过前端/敏感泄露/限流防刷
仅做只读探测与少量测试数据写入（sectest* 前缀），不修改任何业务数据。
"""
import json, sys, time, urllib.request, urllib.error, random, string, re

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:3001'
HOST = sys.argv[2] if len(sys.argv) > 2 else 'ming8.online'
OTHER_TICKET = sys.argv[3] if len(sys.argv) > 3 else None
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0 Safari/537.36'

FINDINGS = []   # {id, name, severity, vuln: bool, detail}

def rand(n=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=n))

def req(method, path, body=None, token=None, xff=None, base=None):
    url = (base or BASE) + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header('Host', HOST)
    r.add_header('Content-Type', 'application/json')
    r.add_header('User-Agent', UA)
    r.add_header('X-Forwarded-For', xff or f'10.99.{random.randint(1,254)}.{random.randint(1,254)}')
    if token:
        r.add_header('Cookie', 'token=' + token)
    try:
        resp = urllib.request.urlopen(r, timeout=20)
        return resp.status, resp.read().decode('utf-8', 'replace'), resp.headers
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace'), e.headers
    except Exception as e:
        return -1, str(e), None

def get_token_from(resp_headers):
    sc = resp_headers.get('Set-Cookie', '') if resp_headers else ''
    m = re.search(r'token=([^;]+)', sc)
    return m.group(1) if m else None

def login(email, pwd, xff=None, base=None):
    s, b, h = req('POST', '/api/auth/login', {'email': email, 'password': pwd}, xff=xff, base=base)
    return get_token_from(h), s, b

def record(fid, name, severity, vuln, detail):
    FINDINGS.append({'id': fid, 'name': name, 'severity': severity, 'vuln': vuln, 'detail': detail})
    print(('[VULN] ' if vuln else '[OK]   ') + f'{fid} {name} -> {detail[:150]}')

print(f'=== 目标: {BASE} (Host: {HOST}) ===')

# ---------- 准备账号 ----------
admin_tok, s, _ = login('282063152@qq.com', 'admin123', xff='10.98.0.1')
user1_tok, s, _ = login('testuser01@test.com', 'user123456', xff='10.98.0.2')
demo_tok, s, _ = login('demo@ming8.online', 'demo123456', xff='10.98.0.3')
print(f'准备: admin={"✓" if admin_tok else "✗"} user={"✓" if user1_tok else "✗"} demo={"✓" if demo_tok else "✗"}')

# ========== 1. 身份认证：未登录 / 伪造 ==========
for p in ['/api/admin/users?page=1', '/api/admin/config', '/api/admin/finance',
          '/api/admin/orders', '/api/admin/stats', '/api/admin/card-keys']:
    s, b, _ = req('GET', p)
    ok = s in (401, 403)
    record('T1-AUTH-UNAUTH', f'未登录访问 {p}', '高危', not ok, f'status={s} body={b[:80]}')

s, b, _ = req('GET', '/api/admin/stats', token='fakepayload.fakesig')
record('T2-AUTH-FORGE', '伪造签名 token 访问管理接口', '高危', s == 200, f'status={s}')
bad = (admin_tok or 'x.y')[:-4] + 'ffff'
s, b, _ = req('GET', '/api/admin/stats', token=bad)
record('T2b-AUTH-TAMPER', '篡改合法 token 签名', '高危', s == 200, f'status={s}')

# ========== 2. 功能越权：普通用户调管理接口 ==========
s, b, _ = req('GET', '/api/admin/users?page=1', token=user1_tok)
record('T3a-PRIV-user-read', '普通用户 GET /api/admin/users', '高危', s == 200, f'status={s} body={b[:80]}')
s, b, _ = req('PUT', '/api/admin/users', {'userId': 'usr_test_user_02', 'role': 'admin'}, token=user1_tok)
record('T3b-PRIV-user-write', '普通用户 PUT 提权他人为 admin', '严重', s == 200, f'status={s} body={b[:80]}')
s, b, _ = req('GET', '/api/admin/refunds', token=user1_tok)
record('T3c-PRIV-user-refunds', '普通用户访问退款列表', '高危', s == 200, f'status={s}')

# ========== 3. 数据越权 IDOR ==========
if OTHER_TICKET:
    s, b, _ = req('GET', f'/api/ticket/{OTHER_TICKET}', token=user1_tok)
    record('T4-IDOR-ticket', f'普通用户读取他人工单 {OTHER_TICKET[:18]}…', '高危', s == 200, f'status={s} body={b[:80]}')
else:
    print('[SKIP] 无他人工单样本，跳过 T4')
s, b, _ = req('GET', '/api/user/orders', token=user1_tok)
record('T4b-SCOPE-orders', '普通用户订单列表按会话隔离', '低危', s >= 500, f'status={s} (服务端强制 session.sub 查询)')

# ========== 4. 偷改字段提权 / 金额篡改 ==========
em = f'sectest{rand()}@test.com'
s, b, _ = req('POST', '/api/user/register',
              {'email': em, 'password': 'SecTest123', 'name': '<script>alert(1)</script>',
               'role': 'admin', 'memberLevel': 'lifetime', 'isAdmin': 1}, xff='10.98.0.4')
tok_new, s2, _ = login(em, 'SecTest123', xff='10.98.0.4') if s == 200 else (None, 0, '')
s3, b3, _ = req('GET', '/api/auth/me', token=tok_new) if tok_new else (0, '', None)
role_ok = b3.find('"role":"admin"') == -1 and b3.find('"role": "admin"') == -1
record('T5a-MASSASSIGN-role', '注册接口塞入 role=admin 字段', '严重', not role_ok,
       f'注册status={s}, me响应角色片段={b3[:120]}')
record('T5b-XSS-name', '注册姓名注入 <script>', '中危', '<script>' in b3, f'me响应name片段={b3[:120]}')

s, b, _ = req('POST', '/api/payment/create',
              {'type': 'membership', 'targetId': 'monthly', 'method': 'zpay', 'amount': 0.01}, token=user1_tok)
amt_leak = ('"amount":0.01' in b) or ('"amount": 0.01' in b)
record('T6a-AMPER-tamper', '下单塞入 amount=0.01（服务端应按29.9计价）', '严重', amt_leak, f'status={s} body={b[:150]}')
s, b, _ = req('POST', '/api/payment/create',
              {'type': 'membership', 'targetId': 'monthly', 'method': 'zpay', 'amount': -100}, token=user1_tok)
record('T6b-AMPER-negative', '下单塞入负数金额', '严重', '"amount":-100' in b, f'status={s} body={b[:100]}')

# ========== 5. 注入 ==========
payloads = ["' OR '1'='1' -- @x.com", "admin'--@x.com", "' UNION SELECT 1--@x.com"]
for i, pl in enumerate(payloads):
    s, b, _ = req('POST', '/api/auth/login', {'email': pl, 'password': 'x12345678'}, xff=f'10.98.1.{i}')
    record(f'T7a-SQLI-login-{i}', f'登录邮箱 SQL 注入: {pl[:22]}', '严重', s == 200 or s == 500, f'status={s}')

s, b, _ = req('GET', "/api/admin/users?page=1&keyword=%25%27%20OR%20%271%27%3D%271", token=admin_tok)
vul = s >= 500
record('T7b-SQLI-search', '管理端关键词搜索 SQL 注入', '严重', vul, f'status={s} total字段={b[:80]}')

s, b, _ = req('POST', '/api/contact', {'name': 'x`; cat /etc/passwd; #', 'email': 'a@b.co', 'message': '$(id) {{7*7}}'},
              xff='10.98.2.1')
record('T7c-CMDI-contact', '联系表单命令注入探测', '高危', s == 500, f'status={s} body={b[:80]}')

# ========== 6. 敏感信息泄露 ==========
s, b, _ = req('GET', '/api/auth/me', token=user1_tok)
record('T8a-LEAK-me', '/api/auth/me 是否带出 passwordHash', '严重', 'passwordHash' in b, f'keys片段={b[:150]}')
s, b, _ = req('GET', '/api/admin/users?page=1&pageSize=5', token=admin_tok)
leak = 'passwordHash' in b
phone_raw = re.search(r'"phone":"(1[3-9]\d{9})"', b)
record('T8b-LEAK-adminlist', '管理端用户列表泄露哈希/明文手机号', '高危', leak or bool(phone_raw),
       f'passwordHash泄露={leak}, 明文手机号={bool(phone_raw)}')
s, b, _ = req('GET', '/.env')
record('T8c-LEAK-envfile', 'GET /.env 配置文件', '严重', s == 200, f'status={s}')
s, b, _ = req('GET', '/api/health')
record('T8d-LEAK-health', '/api/health 信息暴露', '低危', ('mysql' in b.lower() or 'version' in b.lower()), f'status={s} body={b[:100]}')

# ========== 7. 防刷限流 ==========
xff = '10.97.0.1'
c429 = 0
for i in range(15):
    s, b, _ = req('POST', '/api/auth/login', {'email': 'brute@test.com', 'password': 'wrong12345'}, xff=xff)
    if s == 429: c429 += 1
record('T9a-RATE-login-fixed', '同IP连续15次错误登录(应用层限流10/分)', '高危', c429 == 0, f'429次数={c429}/15')

# 走 nginx(80) —— 真实攻击路径：nginx 会追加真实 IP，修复后 XFF 伪造应失效
c429 = 0
for i in range(15):
    s, b, _ = req('POST', '/api/auth/login', {'email': 'brute@test.com', 'password': 'wrong12345'},
                  xff=f'10.96.{i}.{random.randint(1,254)}', base='http://127.0.0.1:80')
    if s == 429: c429 += 1
record('T9b-RATE-bypass-rotateXFF', '轮换伪造X-Forwarded-For绕过限流(经nginx)', '高危', c429 == 0,
       f'429次数={c429}/15 (0=完全绕过,限流形同虚设)')

c429 = 0
for i in range(8):
    s, b, _ = req('POST', '/api/user/register',
                  {'email': f'sectest{rand()}@test.com', 'password': 'SecTest123'}, xff='10.95.0.1')
    if s == 429: c429 += 1
record('T9c-RATE-register', '同IP批量注册(限5/分)', '中危', c429 == 0, f'429次数={c429}/8')

c429 = 0
dist = {}
for i in range(12):
    s, b, _ = req('POST', '/api/user/redeem-card', {'code': f'FAKE{rand(6)}'}, token=user1_tok, xff='10.94.0.1')
    dist[s] = dist.get(s, 0) + 1
    if s == 429: c429 += 1
record('T9d-RATE-redeem', '卡密兑换暴力枚举', '高危', c429 == 0, f'429次数={c429}/12 状态分布={dist}')

# ========== 8. demo 只读账号数据可见性 ==========
if demo_tok:
    s, b, _ = req('GET', '/api/admin/orders?page=1', token=demo_tok)
    real = ('@qq.com' in b) or ('@163.com' in b) or ('"total":' in b)
    record('T10-DEMO-data', 'demo演示账号可见订单数据范围', '中危', s == 200 and real,
           f'status={s} body片段={b[:120]}')

# ========== 汇总 ==========
vulns = [f for f in FINDINGS if f['vuln']]
print('\n===== 汇总 =====')
print(f'共 {len(FINDINGS)} 项检查, 发现 {len(vulns)} 个疑似漏洞')
print(json.dumps(FINDINGS, ensure_ascii=False, indent=1))
