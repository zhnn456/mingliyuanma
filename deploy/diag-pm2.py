"""诊断 PM2 启动失败"""
import paramiko, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, stderr = ssh.exec_command(cmd, timeout=30, get_pty=True)
    out = stdout.read().decode(errors='replace')
    print(f'>>> {cmd[:200]}')
    print(out.rstrip()[:3000])
    print('---')

# PM2 完整列表
run('su - admin -c "pm2 list"')

# PM2 describe ming8
run('su - admin -c "pm2 describe ming8" 2>&1 | head -50')

# 最近日志（错误 + 标准）
run('su - admin -c "pm2 logs ming8 --lines 30 --nostream" 2>&1 | tail -50')

# server.js 文件是否存在
run(f'ls -la /www/ming8/standalone/server.js /www/ming8/standalone/package.json 2>&1')

# .env 软链接
run(f'ls -la /www/ming8/standalone/.env 2>&1')

# 尝试手动启动看错误
run('cd /www/ming8 && su - admin -c "PORT=3001 NODE_ENV=production node standalone/server.js" 2>&1 & sleep 4 && kill %1 2>/dev/null; wait 2>/dev/null')

ssh.close()
