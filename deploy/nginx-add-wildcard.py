"""
修改服务器 Nginx 配置：
1. 加 *.ming8.online 通配符 server_name
2. 保留现有 SSL 配置（泛域名证书后续申请）
3. reload nginx
"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

def run(title, cmd):
    print(f"\n===== {title} =====")
    _, o, e = ssh.exec_command(cmd)
    out = o.read().decode(errors='replace').strip()
    err = e.read().decode(errors='replace').strip()
    if out:
        print(out)
    if err:
        print("[err]", err)
    return out

# 1. 备份当前配置
run("1. 备份当前 Nginx 配置", "cp /etc/nginx/sites-available/ming8 /etc/nginx/sites-available/ming8.bak.$(date +%Y%m%d%H%M%S)")

# 2. 写入新配置（加通配符 server_name + 保留现有 SSL）
new_config = """server {
    server_name ming8.online www.ming8.online *.ming8.online;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    client_max_body_size 50M;

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/ming8.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ming8.online/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.ming8.online) {
        return 301 https://$host$request_uri;
    }
    if ($host = ming8.online) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name ming8.online www.ming8.online *.ming8.online;
    return 404;
}
"""

# 写入新配置文件
sftp = ssh.open_sftp()
with sftp.file('/etc/nginx/sites-available/ming8.new', 'w') as f:
    f.write(new_config)
sftp.close()
print("2. 新配置已写入 /etc/nginx/sites-available/ming8.new")

# 3. 替换并测试
run("3. 替换配置文件", "mv /etc/nginx/sites-available/ming8.new /etc/nginx/sites-available/ming8")
run("4. 测试 Nginx 配置", "nginx -t 2>&1")

# 5. reload
run("5. Reload Nginx", "systemctl reload nginx 2>&1")

# 6. 验证
run("6. 验证 Nginx 配置生效", "grep 'server_name' /etc/nginx/sites-available/ming8")

# 7. 测试一个子域名（DNS 还没加，应该解析不到，但 Nginx 配置已就绪）
run("7. 测试 test.ming8.online 本地访问", "curl -s -o /dev/null -w '%{http_code}' -H 'Host: test.ming8.online' http://localhost:80/ 2>&1")

ssh.close()
print("\n===== Nginx 配置完成 =====")
print("下一步：在 CF 后台加 *.ming8.online 的 A 记录 → 47.82.116.220")
