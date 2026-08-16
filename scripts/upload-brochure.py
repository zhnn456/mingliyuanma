"""上传推介文档到服务器 public 目录"""
import paramiko, time, os

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'Aa20260618'
REMOTE_DIR = '/www/ming8'
LOCAL_FILE = 'public/product-brochure.html'

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, look_for_keys=False, allow_agent=False)

    log = lambda m: print(f'[{time.strftime("%H:%M:%S")}] {m}')
    log(f'上传 {LOCAL_FILE}...')

    sftp = ssh.open_sftp()
    sftp.put(LOCAL_FILE, f'{REMOTE_DIR}/public/product-brochure.html')

    size = os.path.getsize(LOCAL_FILE)
    log(f'上传完成 ({size/1024:.1f} KB)')

    # 验证可访问
    import urllib.request
    try:
        url = 'https://ming8.online/product-brochure.html'
        req = urllib.request.Request(url, method='HEAD')
        resp = urllib.request.urlopen(req, timeout=10)
        log(f'验证: HTTP {resp.status} - {url}')
    except Exception as e:
        log(f'验证失败: {e}')

    ssh.close()
    log('完成')

if __name__ == '__main__':
    main()
