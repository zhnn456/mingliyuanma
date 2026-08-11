"""插入一条测试公告并验证公告 API"""
import paramiko, json

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

SQL = """INSERT INTO Announcement (id, icon, badge, title, content, link, linkText, sortOrder, enabled, createdAt)
VALUES ('ann_test_centered', '🎯', '系统测试', '居中弹窗显示测试',
        '这是一条测试公告，用于验证新的居中弹窗展示效果。如果您看到此弹窗以页面正中央的模态形式展示，说明公告系统升级已生效。点击下方按钮可查看示例页面。',
        '/demo-home', '查看示例', 5, 1, NOW())
ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), enabled=1;"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

# 用 SFTP 写 SQL 文件，避免 shell 引号问题
sftp = ssh.open_sftp()
with sftp.open('/tmp/insert_ann.sql', 'w') as f:
    f.write(SQL)
sftp.close()

_, stdout, stderr = ssh.exec_command('mysql -u ming8 -p"Ming8@2026!" ming8_db < /tmp/insert_ann.sql 2>&1')
out = stdout.read().decode(errors='replace')
print("插入结果:", out or "成功（无报错）")

# 清理临时文件
ssh.exec_command('rm -f /tmp/insert_ann.sql')

# 验证公告 API
print("\n===== 公告 API 返回 =====")
_, stdout, _ = ssh.exec_command('curl -s http://localhost:3001/api/announcement')
data = json.loads(stdout.read().decode(errors='replace'))
for a in data.get('announcements', []):
    print(f"  [{a['sortOrder']}] {a['id']:25s} | {a['title']:25s} | enabled={a['enabled']}")

# 查询数据库确认
print("\n===== 数据库 Announcement 表 =====")
_, stdout, _ = ssh.exec_command('mysql -u ming8 -p"Ming8@2026!" ming8_db -e "SELECT id,title,enabled,sortOrder FROM Announcement ORDER BY sortOrder" 2>&1')
print(stdout.read().decode(errors='replace'))

ssh.close()
print("✅ 完成")
