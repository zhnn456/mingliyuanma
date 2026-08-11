"""补录今天的历史部署记录到 UpdateLog 表"""
import paramiko

HOST = '47.82.116.220'
USER = 'root'
PASSWORD = 'sanBAO1234!'

SQL = """INSERT INTO UpdateLog (id, version, title, content, type, isMajor, operatorName, tag, status, category, createdAt) VALUES
('ul_hist_1', '4.0.0', '品牌统一为先知命理网', '统一网站名称为先知命理网(简称知命网)，覆盖layout/login/register/home/404/版权/支付/PDF水印等18个文件46处，域名更新为ming8.online', 'feature', 1, 'manual', 'de1d584', 'success', '品牌', '2026-08-09 18:35:00'),
('ul_hist_2', '4.0.0', '管理后台修复与数据恢复', '修复ZiweiRecord等表缺失导致管理后台500错误(用safeCount容错)，从Cloudflare D1恢复90条数据到MySQL(Agent/User/Order等)', 'fix', 0, 'manual', 'b73e744', 'success', '修复', '2026-08-09 19:29:00'),
('ul_hist_3', '4.0.0', '公告系统升级为多公告队列', '新建Announcement表+懒迁移+已读追踪(localStorage)+管理后台CRUD，首次部署右下角浮层样式', 'feature', 0, 'manual', '9d65ec3', 'success', '功能', '2026-08-09 20:12:00'),
('ul_hist_4', '4.0.0', '移除CF代码同步+公告居中弹窗', '删除wrangler配置和deploy-cf.yml，清理package.json的CF依赖，公告改为居中模态弹窗(参考预览页方案3)', 'update', 0, 'manual', 'e021064', 'success', '重构', '2026-08-09 22:00:00')
ON DUPLICATE KEY UPDATE title=VALUES(title);"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)

sftp = ssh.open_sftp()
with sftp.open('/tmp/backfill.sql', 'w') as f:
    f.write(SQL)
sftp.close()

_, stdout, _ = ssh.exec_command('mysql -u ming8 -p"Ming8@2026!" ming8_db < /tmp/backfill.sql 2>&1 | grep -v Warning')
print("补录结果:", stdout.read().decode(errors='replace').strip() or "成功")

ssh.exec_command('rm -f /tmp/backfill.sql')

# 验证全部记录
_, stdout, _ = ssh.exec_command('mysql -u ming8 -p"Ming8@2026!" ming8_db -e "SELECT id,version,title,tag,createdAt FROM UpdateLog ORDER BY createdAt DESC" 2>&1 | grep -v Warning')
print("\n===== UpdateLog 全部记录 =====")
print(stdout.read().decode(errors='replace'))

ssh.close()
print("✅ 补录完成")
