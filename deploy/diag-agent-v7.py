"""查看 agent-orders 实际错误堆栈"""
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('47.82.116.220', username='root', password='sanBAO1234!', timeout=10, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=30):
    _, stdout, _ = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode(errors='replace').strip()

# 查看Order表所有字段
print("Order表字段:")
print(run('mysql -uming8 -p"Ming8@2026!" ming8_db -e "SHOW COLUMNS FROM `Order`;" 2>/dev/null'))

# 查看agent-orders错误堆栈
print("\n\nagent-orders 错误堆栈:")
print(run('su - admin -c "pm2 logs ming8 --lines 200 --nostream --err" 2>/dev/null | grep -B1 -A15 "agent-orders\\|代理商订单\\|获取代理商订单" | tail -60'))

# 检查所有agent相关错误
print("\n\n所有agent相关错误:")
print(run('su - admin -c "pm2 logs ming8 --lines 300 --nostream --err" 2>/dev/null | grep -E "Error|error" | tail -30'))

# 重启PM2清空日志，便于查看新错误
print("\n重启 PM2 清空日志...")
print(run('su - admin -c "pm2 flush ming8" 2>/dev/null'))

# 再次触发错误
print("\n触发 agent-orders API:")
print(run('curl -s -c /tmp/ac.txt -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test_source@ming8.com","password":"Test@2026"}\'')[:200])
print(run('curl -s -b /tmp/ac.txt http://localhost:3001/api/agent/agent-orders')[:300])
print(run('curl -s -b /tmp/ac.txt http://localhost:3001/api/agent/commissions?pageSize=1')[:300])
print(run('curl -s -b /tmp/ac.txt http://localhost:3001/api/agent/settlements')[:300])

# 查看新错误
import time
time.sleep(2)
print("\n\n新错误日志:")
print(run('su - admin -c "pm2 logs ming8 --lines 30 --nostream --err" 2>/dev/null | tail -80'))

run('rm -f /tmp/ac.txt')
ssh.close()
