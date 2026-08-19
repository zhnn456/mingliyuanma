"""上传支付宝个人收款码图片并设置配置"""
import paramiko
import json
import os

HOST = '47.79.237.103'
USER = 'root'
PWD = 'Aa20260618'

LOCAL_IMG = r'f:\mingliyuanma\public\images\personal-alipay-qr.jpg'
REMOTE_IMG = '/www/ming8/public/images/personal-alipay-qr.jpg'
REMOTE_URL = '/images/personal-alipay-qr.jpg'

t = paramiko.Transport((HOST, 22))
t.connect(username=USER, password=PWD)
ssh = paramiko.SSHClient()
ssh._transport = t
sftp = paramiko.SFTPClient.from_transport(t)

# 1. 上传支付宝收款码图片
print(f'[1] 上传图片: {LOCAL_IMG} -> {REMOTE_IMG}')
sftp.put(LOCAL_IMG, REMOTE_IMG)
# �查文件
try:
    st = sftp.stat(REMOTE_IMG)
    print(f'    上传成功，大小: {st.st_size} 字节')
except Exception as e:
    print(f'    上传失败: {e}')
    t.close()
    raise SystemExit(1)

# 2. 修复权限（确保 nginx 可读）
ssh.exec_command(f'chmod 644 {REMOTE_IMG} && chown root:root {REMOTE_IMG}')

# 3. 登录获取 cookie
print('[2] 登录管理后台...')
cmd = 'curl -s -c /tmp/cookie.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"282063152@qq.com","password":"admin123"}\''
stdin, stdout, stderr = ssh.exec_command(cmd)
login_resp = stdout.read().decode()
print('    登录响应:', login_resp[:150])

# 4. 读取现有配置
print('[3] 读取现有支付配置...')
cmd = 'curl -s -b /tmp/cookie.txt http://localhost:3001/api/admin/payment-config'
stdin, stdout, stderr = ssh.exec_command(cmd)
cfg_resp = stdout.read().decode()
try:
    cfg_data = json.loads(cfg_resp)
    existing = cfg_data.get('config', {}) or {}
    print('    当前 personalQrUrl(微信):', existing.get('personalQrUrl', '(空)'))
    print('    当前 personalQrAlipayUrl(支付宝):', existing.get('personalQrAlipayUrl', '(空)'))
except Exception as e:
    print('    解析失败:', e, cfg_resp[:300])
    existing = {}

# 5. 保存支付宝收款码配置（保留微信收款码 + 其他现有配置）
print('[4] 保存支付宝收款码配置...')
payload = {
    # 微信收款码（保留现有值）
    'personalQrUrl': existing.get('personalQrUrl') or '/images/personal-wechat-qr.jpg',
    'personalQrType': 'wechat',  # 主类型保持 wechat，前端按 URL 判断
    # 支付宝收款码（新增）
    'personalQrAlipayUrl': REMOTE_URL,
}

# 保留其他非敏感字段
for k in ['wechatAppId', 'wechatMchId', 'wechatApiV3Key', 'wechatCertSerial', 'wechatNotifyUrl',
          'alipayAppId', 'alipayNotifyUrl', 'alipayReturnUrl', 'alipayGateway',
          'zpayPid', 'zpayApiUrl', 'zpayNotifyUrl', 'zpayReturnUrl',
          'paypalClientId', 'paypalMode', 'paypalNotifyUrl']:
    if existing.get(k):
        payload[k] = existing[k]

# 保留 enabledMethods
if existing.get('enabledMethods'):
    payload['enabledMethods'] = existing['enabledMethods']

cmd = "curl -s -b /tmp/cookie.txt -X POST http://localhost:3001/api/admin/payment-config -H 'Content-Type: application/json' -d '" + json.dumps(payload) + "'"
stdin, stdout, stderr = ssh.exec_command(cmd)
save_resp = stdout.read().decode()
print('    保存响应:', save_resp[:300])

# 6. 验证
print('[5] 验证保存结果...')
cmd = 'curl -s -b /tmp/cookie.txt http://localhost:3001/api/admin/payment-config'
stdin, stdout, stderr = ssh.exec_command(cmd)
verify_resp = stdout.read().decode()
try:
    verify_data = json.loads(verify_resp)
    v = verify_data.get('config', {}) or {}
    print('    验证 personalQrUrl(微信):', v.get('personalQrUrl'))
    print('    验证 personalQrAlipayUrl(支付宝):', v.get('personalQrAlipayUrl'))
    print('    验证 personalQrType:', v.get('personalQrType'))
except Exception as e:
    print('    验证失败:', e, verify_resp[:300])

# 7. 测试图片访问
print('[6] 测试支付宝收款码图片访问...')
cmd = f'curl -s -o /dev/null -w "%{{http_code}}" http://localhost:3001{REMOTE_URL}'
stdin, stdout, stderr = ssh.exec_command(cmd)
http_code = stdout.read().decode()
print(f'    图片 HTTP 状态: {http_code}')

cmd = f'curl -s -o /dev/null -w "%{{http_code}}" https://ming8.online{REMOTE_URL}'
stdin, stdout, stderr = ssh.exec_command(cmd)
http_code2 = stdout.read().decode()
print(f'    外网访问 HTTP 状态: {http_code2}')

sftp.close()
t.close()
print('\n[完成] 支付宝个人收款码配置已设置')
