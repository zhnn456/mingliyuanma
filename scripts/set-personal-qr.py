"""设置个人收款码配置（上传微信收款码后）"""
import paramiko
import json

HOST = '47.79.237.103'
USER = 'root'
PWD = 'Aa20260618'

t = paramiko.Transport((HOST, 22))
t.connect(username=USER, password=PWD)
ssh = paramiko.SSHClient()
ssh._transport = t

# 1. 登录获取 cookie
cmd = 'curl -s -c /tmp/cookie.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"282063152@qq.com","password":"admin123"}\''
stdin, stdout, stderr = ssh.exec_command(cmd)
login_resp = stdout.read().decode()
print('登录响应:', login_resp[:200])

# 2. 读取现有配置
cmd = 'curl -s -b /tmp/cookie.txt http://localhost:3001/api/admin/payment-config'
stdin, stdout, stderr = ssh.exec_command(cmd)
cfg_resp = stdout.read().decode()
try:
    cfg_data = json.loads(cfg_resp)
    print('当前 personalQrUrl:', cfg_data.get('config', {}).get('personalQrUrl', '(空)'))
    print('当前 personalQrType:', cfg_data.get('config', {}).get('personalQrType', '(空)'))
except:
    print('当前配置:', cfg_resp[:300])

# 3. 保存个人收款码配置（合并现有配置，只更新 personalQr 字段）
# 注意：API 会做 ?? existing ?? '' 合并，但为安全起见直接提交所有字段
# 先读取现有配置作为基础
existing = cfg_data.get('config', {}) if cfg_data else {}

payload = {
    'personalQrUrl': '/images/personal-wechat-qr.jpg',
    'personalQrType': 'wechat',
}

# 把现有非敏感字段也带上，避免被清空
for k in ['wechatAppId', 'wechatMchId', 'wechatApiV3Key', 'wechatCertSerial', 'wechatNotifyUrl',
          'alipayAppId', 'alipayNotifyUrl', 'alipayReturnUrl', 'alipayGateway',
          'zpayPid', 'zpayApiUrl', 'zpayNotifyUrl', 'zpayReturnUrl',
          'paypalClientId', 'paypalMode', 'paypalNotifyUrl',
          'stripePublishableKey', 'stripeWebhookSecret', 'stripeNotifyUrl']:
    if existing.get(k):
        payload[k] = existing[k]

# 敏感字段：configured=true 的保留原值（API 会做 ?? existing?.xxxEnc ?? '' 处理）
# 不传敏感字段值时，API 会保留原加密值

cmd = "curl -s -b /tmp/cookie.txt -X POST http://localhost:3001/api/admin/payment-config -H 'Content-Type: application/json' -d '" + json.dumps(payload) + "'"
stdin, stdout, stderr = ssh.exec_command(cmd)
save_resp = stdout.read().decode()
print('保存响应:', save_resp[:300])

# 4. 验证
cmd = 'curl -s -b /tmp/cookie.txt http://localhost:3001/api/admin/payment-config'
stdin, stdout, stderr = ssh.exec_command(cmd)
verify_resp = stdout.read().decode()
try:
    verify_data = json.loads(verify_resp)
    print('验证 personalQrUrl:', verify_data.get('config', {}).get('personalQrUrl'))
    print('验证 personalQrType:', verify_data.get('config', {}).get('personalQrType'))
except:
    print('验证响应:', verify_resp[:300])

# 5. 测试图片是否可访问
cmd = 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/images/personal-wechat-qr.jpg'
stdin, stdout, stderr = ssh.exec_command(cmd)
http_code = stdout.read().decode()
print(f'图片访问 HTTP 状态: {http_code}')

t.close()
print('完成')
