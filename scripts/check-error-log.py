"""查看最新的错误日志"""
import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

def run(ssh, cmd, timeout=30):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace').strip()

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='Aa20260618',
            look_for_keys=False, allow_agent=False, timeout=30)

# 查看最新 50 行错误日志
print('=== 最新错误日志 ===')
out = run(ssh, 'tail -50 /www/ming8/logs/error.log 2>/dev/null')
print(out)

ssh.close()
