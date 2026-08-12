"""检查中央平台 .env 是否有 APP_LICENSE_KEY（不应该有）"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15, look_for_keys=False, allow_agent=False)

def run(cmd):
    _, stdout, _ = ssh.exec_command(cmd, get_pty=True)
    return stdout.read().decode().strip()

# 检查 .env 里是否有 APP_LICENSE_KEY 和 IS_CENTER
print('=== 服务器 .env 授权相关配置 ===')
print(run('grep -E "^APP_LICENSE_KEY|^APP_AGENT_ID|^IS_CENTER|^CENTER_API|^APP_BOUND_DOMAIN|^APP_VERSION" /www/ming8/.env 2>/dev/null || echo "(无相关配置)"'))

# 检查 standalone/.env 软链接
print('\n=== standalone/.env 软链接 ===')
print(run('ls -la /www/ming8/standalone/.env 2>/dev/null || echo "(无)"'))

ssh.close()
