"""
通过 SSH 在服务器上创建演示账号（demo 角色）
"""
import paramiko
import time

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'Aa20260618'
REMOTE_DIR = '/www/ming8'

def log(msg):
    ts = time.strftime('%H:%M:%S')
    print(f'[{ts}] {msg}')

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, look_for_keys=False, allow_agent=False)

    # 上传创建脚本
    log('上传创建脚本...')
    sftp = ssh.open_sftp()
    sftp.put('scripts/create-demo-account.mjs', f'{REMOTE_DIR}/scripts/create-demo-account.mjs')
    log('上传完成')

    # 执行
    log('创建演示账号...')
    stdin, stdout, stderr = ssh.exec_command(
        f'cd {REMOTE_DIR} && source .env 2>/dev/null; node scripts/create-demo-account.mjs 2>&1'
    )
    output = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')

    print('\n' + '=' * 60)
    print('  服务器执行结果')
    print('=' * 60)
    print(output.encode('utf-8', errors='replace').decode('utf-8'))
    if err:
        print(f'\nstderr: {err.encode("utf-8", errors="replace").decode("utf-8")}')

    ssh.close()
    log('完成')

if __name__ == '__main__':
    main()
