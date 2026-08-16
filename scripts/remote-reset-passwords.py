"""远程执行重置密码脚本"""
import paramiko
import time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'Aa20260618'
REMOTE_DIR = '/www/ming8'

def log(msg):
    print(f'[{time.strftime("%H:%M:%S")}] {msg}')

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, look_for_keys=False, allow_agent=False)

    log('上传重置脚本...')
    sftp = ssh.open_sftp()
    sftp.put('scripts/reset-test-passwords.mjs', f'{REMOTE_DIR}/scripts/reset-test-passwords.mjs')
    log('上传完成')

    log('执行密码重置...')
    stdin, stdout, stderr = ssh.exec_command(
        f'cd {REMOTE_DIR} && source .env 2>/dev/null; node scripts/reset-test-passwords.mjs 2>&1'
    )
    output = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')

    print('\n' + output.encode('utf-8', errors='replace').decode('utf-8'))
    if err:
        print(f'stderr: {err.encode("utf-8", errors="replace").decode("utf-8")}')

    ssh.close()
    log('完成')

if __name__ == '__main__':
    main()
