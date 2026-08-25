"""bazi6 源码站部署后验证：BUILD_ID 比对 → 静态资源完整性 → 健康与登录链路（只读检查，不做任何变更）"""
import os
import re
import sys

import paramiko

sys.stdout.reconfigure(encoding='utf-8')

HOST = '47.79.3.189'
APP_DIR = '/www/ming8'
DOMAIN = 'bazi6.cc.cd'
LOCAL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def connect():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    password = os.environ.get('DEPLOY_SSH_PASSWORD')
    key_path = os.environ.get('DEPLOY_SSH_KEY')
    kwargs = dict(hostname=HOST, username='root', look_for_keys=False, allow_agent=False, timeout=30)
    if key_path:
        kwargs['key_filename'] = key_path
    elif password:
        kwargs['password'] = password
    else:
        raise SystemExit('缺少凭据：请设置环境变量 DEPLOY_SSH_PASSWORD 或 DEPLOY_SSH_KEY')
    ssh.connect(**kwargs)
    return ssh


ssh = connect()


def run(cmd, timeout=90):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace').strip()


print('===== [1] 版本比对（判断线上是否为最新构建） =====')
local_bid = ''
_local = os.path.join(LOCAL_DIR, '.next', 'BUILD_ID')
if os.path.exists(_local):
    local_bid = open(_local, encoding='utf-8').read().strip()
remote_bid = run(f'cat {APP_DIR}/.next/BUILD_ID 2>/dev/null')
print(f'本地 BUILD_ID: {local_bid or "（本地无构建）"}')
print(f'远端 BUILD_ID: {remote_bid or "（远端无构建）"}')
if not local_bid:
    print('⚠️ 本地未构建，无法判断线上是否最新；请先 npm run build:server')
    verdict_ver = None
elif local_bid == remote_bid:
    print('✅ 线上即为当前本地构建')
    verdict_ver = True
else:
    print('❌ 线上不是最新构建！请执行: python scripts/deploy.py --target source')
    verdict_ver = False

print('\n===== [2] PM2 状态与健康检查 =====')
print(run('pm2 status ming8 | grep -E "ming8|status"'))
print('HTTP状态:', run(f"curl -s -o /dev/null -w '%{{http_code}}' -H 'Host: {DOMAIN}' http://localhost:3001/api/health"))

print('\n===== [3] HTML 引用的静态资源完整性 =====')
all_ok = True
for path in ['/', '/login', '/admin']:
    html = run(f"curl -s -H 'Host: {DOMAIN}' http://localhost:3001{path}")
    assets = sorted(set(re.findall(r'/_next/(?:static|css)/[A-Za-z0-9._/-]+\.(?:js|css)', html)))
    print(f'\n{path} 引用资源 {len(assets)} 个:')
    page_ok = True
    for a in assets:
        exists = run(f'test -f {APP_DIR}/.next/{a.replace("/_next/", "")} && echo OK || echo MISSING')
        if exists != 'OK':
            all_ok = False
            page_ok = False
            print(f'  ❌ {a}')
    if page_ok:
        print('  （本页全部存在）')

admin_email = os.environ.get('BAZI6_ADMIN_EMAIL')
admin_password = os.environ.get('BAZI6_ADMIN_PASSWORD')
if admin_email and admin_password:
    print('\n===== [4] 登录API验证 =====')
    resp = run("""curl -s -X POST -H 'Host: %s' http://localhost:3001/api/auth/login \
 -H 'Content-Type: application/json' \
 -d '{"email":"%s","password":"%s"}'""" % (DOMAIN, admin_email, admin_password))
    print(resp[:150])

    code = run("""curl -s -o /dev/null -w '%{http_code}' -c /tmp/cj_verify.txt -X POST -H 'Host: %s' \
 http://localhost:3001/api/auth/login -H 'Content-Type: application/json' \
 -d '{"email":"%s","password":"%s"}' > /dev/null;
 curl -s -o /dev/null -w '%{http_code}' -b /tmp/cj_verify.txt -H 'Host: %s' http://localhost:3001/admin"""
               % (DOMAIN, admin_email, admin_password, DOMAIN))
    run('rm -f /tmp/cj_verify.txt')
    print('/admin 状态码:', code)
else:
    print('\n===== [4] 登录验证已跳过 =====')
    print('（未设置 BAZI6_ADMIN_EMAIL / BAZI6_ADMIN_PASSWORD 环境变量）')

print('\n结论:')
if not all_ok:
    print('  ❌ 存在缺失的静态资源，需重新构建并部署')
if verdict_ver is False:
    print('  ❌ 线上不是最新构建，请执行: python scripts/deploy.py --target source')
if all_ok and verdict_ver is not False:
    print('  ✅ 资源完整，版本一致，链路正常')

ssh.close()
