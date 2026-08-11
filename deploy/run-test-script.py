"""上传并执行测试数据生成脚本"""
import paramiko, os, time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'
LOCAL_SCRIPT = r'f:\mingliyuanma\deploy\generate-test-source-agent.js'
REMOTE_SCRIPT = '/www/ming8/generate-test-source-agent.js'

def run(ssh, cmd, timeout=120):
    print(f"\n>>> {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors='replace')
    err = stderr.read().decode(errors='replace')
    if out: print(out.strip()[:5000])
    if err and 'Using a password' not in err and 'Warning' not in err:
        print(f"[stderr] {err.strip()[:2000]}")
    return out, err

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print("连接服务器...")
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

# 上传脚本
print(f"\n===== 上传脚本 =====")
sftp = ssh.open_sftp()
sftp.put(LOCAL_SCRIPT, REMOTE_SCRIPT)
print(f"  ✓ 已上传到 {REMOTE_SCRIPT}")
sftp.close()

# 执行脚本
print(f"\n===== 执行测试数据生成脚本 =====")
out, err = run(ssh, f'cd /www/ming8 && su - admin -c "cd /www/ming8 && node generate-test-source-agent.js" 2>&1', timeout=60)

# 清理
print(f"\n===== 清理临时脚本 =====")
run(ssh, f'rm -f {REMOTE_SCRIPT}')

ssh.close()
print("\n===== 完成 =====")
