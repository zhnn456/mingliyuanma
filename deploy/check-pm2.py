"""检查服务器当前 PM2 启动方式"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd, timeout=30, get_pty=True)
    out = stdout.read().decode(errors='replace')
    print(f'>>> {cmd}')
    print(out.rstrip()[:2000])
    print('---')

# PM2 当前启动详情
run('su - admin -c "pm2 describe ming8 2>/dev/null" | grep -E "script path|exec cwd|exec mode|node args|status|port|script args"')

# ecosystem 文件
run('cat /www/ming8/ecosystem.config.js 2>/dev/null || echo "no ecosystem.config.js"')
run('ls -la /www/ming8/ecosystem* 2>/dev/null')

# 当前的 .env 是否有 PORT
run('grep -E "^PORT|^NODE_ENV" /www/ming8/.env 2>/dev/null || echo "no PORT in .env"')

# server.js 启动文件检测
run('ls -la /www/ming8/.next/standalone/server.js 2>/dev/null || echo "no standalone/server.js on server"')

# 端口监听
run('ss -tlnp 2>/dev/null | grep -E "3001|3000"')

ssh.close()
