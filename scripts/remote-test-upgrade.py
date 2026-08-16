"""
通过 SSH 在服务器上执行升级流程测试
1. 上传测试脚本到服务器
2. 执行数据库迁移
3. 运行测试脚本
4. 输出结果
"""
import paramiko
import time
import os

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
    
    # 1. 上传测试脚本和迁移脚本
    log('上传测试脚本...')
    sftp = ssh.open_sftp()
    sftp.put('scripts/test-upgrade-flow.mjs', f'{REMOTE_DIR}/scripts/test-upgrade-flow.mjs')
    sftp.put('scripts/mysql-migrate-v4.1.0.sql', f'{REMOTE_DIR}/scripts/mysql-migrate-v4.1.0.sql')
    log('上传完成')
    
    # 2. 执行数据库迁移
    log('执行数据库迁移...')
    stdin, stdout, stderr = ssh.exec_command(f'cd {REMOTE_DIR} && mysql -u ming8 -p"Ming8@2026!" ming8_db < scripts/mysql-migrate-v4.1.0.sql 2>&1')
    output = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if output:
        log(f'迁移输出: {output}')
    if err:
        log(f'迁移错误(可能已执行): {err}')
    
    # 3. 执行测试脚本
    log('执行升级流程测试...')
    stdin, stdout, stderr = ssh.exec_command(f'cd {REMOTE_DIR} && source .env 2>/dev/null; node scripts/test-upgrade-flow.mjs 2>&1')
    output = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    
    print('\n' + '='*60)
    print('  服务器端测试结果')
    print('='*60)
    # 替换可能导致编码问题的emoji
    output_clean = output.replace('\u274c', '[X]').replace('\u2705', '[OK]').replace('\u2705', '[OK]')
    print(output_clean.encode('utf-8', errors='replace').decode('utf-8'))
    if err:
        print(f'\nstderr: {err.encode("utf-8", errors="replace").decode("utf-8")}')
    
    ssh.close()
    log('测试完成')

if __name__ == '__main__':
    main()
