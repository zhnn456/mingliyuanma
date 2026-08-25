import os
import paramiko
import warnings
import time
warnings.filterwarnings('ignore')

HOST, PASS = '47.79.3.189', os.environ['DEPLOY_SSH_PASSWORD']
CONF_PATH = '/etc/nginx/sites-available/bazi6.cc.cd'
BACKUP = CONF_PATH + '.bak.' + str(int(time.time()))

NEW_CONF = '''# bazi6.cc.cd 加固版配置（自动生成于 {ts}）
# 限流区域定义（本文件被 include 进 http 块，zone 指令在此合法）
# Cloudflare 代理场景：优先使用 CF-Connecting-IP 作为限流键，避免全站共享边缘IP被误伤
map $http_cf_connecting_ip $real_client_ip {{
    default $http_cf_connecting_ip;
    ""      $remote_addr;
}}

limit_req_zone $real_client_ip zone=general_zone:10m rate=30r/s;
limit_req_zone $real_client_ip zone=auth_zone:10m rate=2r/s;
limit_req_zone $real_client_ip zone=api_zone:10m rate=10r/s;
limit_conn_zone $real_client_ip zone=conn_zone:10m;

# 广场接口微缓存：洪水流量由缓存直接消化（10秒窗口）
proxy_cache_path /var/cache/nginx_square levels=1:2 keys_zone=square_cache:10m max_size=50m inactive=60s use_temp_path=off;

server {{
    listen 80;
    server_name bazi6.cc.cd www.bazi6.cc.cd;

    # 每 IP 并发连接上限（防慢速连接占满）
    limit_conn conn_zone 20;

    # 限流拒绝统一返回 429（默认503语义不准确）
    limit_req_status 429;
    limit_conn_status 429;

    # 敏感路径一律 404
    location ~* /\\.(env|git|svn|DS_Store|htaccess) {{
        return 404;
    }}

    # 已知恶意工具 UA 直接拒绝
    if ($http_user_agent ~* (sqlmap|nikto|nmap|masscan|dirbuster|acunetix)) {{
        return 403;
    }}

    # 登录：严格限流（2r/s burst 5，防爆破）
    location = /api/auth/login {{
        limit_req zone=auth_zone burst=5 nodelay;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}

    # 注册/卡密兑换：严格限流
    location ~ ^/api/user/(register|redeem-card)$ {{
        limit_req zone=auth_zone burst=5 nodelay;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}

    # 祈福广场：公开聚合数据，源站侧 10 秒微缓存吸收重复请求
    location = /api/offering/square {{
        limit_req zone=api_zone burst=20 nodelay;
        proxy_cache square_cache;
        proxy_cache_valid 200 10s;
        proxy_cache_key "square";
        proxy_ignore_headers Cache-Control Set-Cookie;
        add_header X-Cache-Status $upstream_cache_status always;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}

    # 其余 API：常规限流（10r/s burst 20）
    location /api/ {{
        limit_req zone=api_zone burst=20 nodelay;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}

    location /_next/static/ {{
        proxy_pass http://127.0.0.1:3001;
        expires 30d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }}

    location / {{
        limit_req zone=general_zone burst=60 nodelay;
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 65s;
        proxy_send_timeout 65s;
    }}

    # 上传体积收紧（原50M过大）
    client_max_body_size 10M;
}}
'''.format(ts=time.strftime('%Y-%m-%d %H:%M:%S'))

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username='root', password=PASS, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', 'ignore').strip()
    err = stderr.read().decode('utf-8', 'ignore').strip()
    return code, out, err

# 1) 备份
code, out, err = run(f'cp {CONF_PATH} {BACKUP} && echo OK')
assert out == 'OK', f'备份失败: {err}'
print(f'[1] 已备份 → {BACKUP}')

mkdir = run('mkdir -p /var/cache/nginx_square && chown www-data:www-data /var/cache/nginx_square && echo OK')
print('[2] 缓存目录:', mkdir[1] or mkdir[2])

# 2) 上传新配置
sftp = ssh.open_sftp()
with sftp.open(CONF_PATH, 'w') as f:
    f.write(NEW_CONF)
print('[3] 新配置已上传')

# 3) nginx -t 校验，失败即回滚
code, out, err = run('nginx -t 2>&1')
print('[4] nginx -t:', out or err)
if code != 0:
    run(f'cp {BACKUP} {CONF_PATH}')
    print('❌ 配置校验失败，已回滚旧配置')
    ssh.close()
    raise SystemExit(1)

# 4) reload 并验证
code, out, err = run('nginx -s reload 2>&1; sleep 1; curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ -H "Host: bazi6.cc.cd"')
http_code = out.strip().split('\n')[-1].strip()
print('[5] reload 完成，本地验证 HTTP:', http_code)
if http_code != '200':
    run(f'cp {BACKUP} {CONF_PATH}')
    run('nginx -s reload')
    print('❌ reload 后本地验证失败，已回滚')
    ssh.close()
    raise SystemExit(1)

# 5) 验证限流与缓存头生效
code, out, _ = run('curl -s -D - -o /dev/null http://127.0.0.1/api/offering/square -H "Host: bazi6.cc.cd" | grep -iE "x-cache-status|HTTP/" | head -3')
print('[6] 广场缓存头:', out)
code, out, _ = run('for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code} " http://127.0.0.1/api/auth/login -H "Host: bazi6.cc.cd" -X POST; done; echo')
print('[7] 登录连击12次状态序列:', out)

sftp.close(); ssh.close()
print('✅ nginx 加固完成')
