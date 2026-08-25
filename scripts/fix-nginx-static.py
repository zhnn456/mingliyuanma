"""更新 nginx 配置：添加 /images/ 静态文件直接服务，避免 404"""
import os
import paramiko

t = paramiko.Transport(('47.79.237.103', 22))
t.connect(username='root', password=os.environ['DEPLOY_SSH_PASSWORD'])
ssh = paramiko.SSHClient()
ssh._transport = t

# 新的 nginx 配置：添加 /images/ 静态文件直接服务
new_conf = '''server {
    listen 80 default_server;
    server_name ming8.online www.ming8.online _;

    client_max_body_size 50M;

    # 静态图片直接服务（不经过 Next.js，避免 public 目录 404）
    location /images/ {
        alias /www/ming8/public/images/;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
'''

# 写入新配置
cmd = "cat > /etc/nginx/sites-enabled/ming8 << 'NGINX_EOF'\n" + new_conf + "NGINX_EOF"
stdin, stdout, stderr = ssh.exec_command(cmd)
print('写入配置:', stdout.read().decode(), stderr.read().decode())

# 测试 nginx 配置
stdin, stdout, stderr = ssh.exec_command('nginx -t 2>&1')
print('Nginx 测试:', stdout.read().decode(), stderr.read().decode())

# 重载 nginx
stdin, stdout, stderr = ssh.exec_command('nginx -s reload 2>&1')
print('Nginx 重载:', stdout.read().decode(), stderr.read().decode())

# 验证图片可访问
stdin, stdout, stderr = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost/images/personal-wechat-qr.jpg; echo')
print('图片 HTTP 状态:', stdout.read().decode())

t.close()
