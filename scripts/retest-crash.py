"""重新测试之前崩溃的 API"""
import requests, sys, json
sys.stdout.reconfigure(encoding='utf-8')

s = requests.Session()
login_data = {'email': '282063152@qq.com', 'password': 'Admin@2026!'}
res = s.post('https://ming8.online/api/auth/login', json=login_data, timeout=15)
print('登录:', res.status_code)

base = 'https://ming8.online'

# 之前崩溃的 24 个 API
crash_apis = [
    ('优惠券', '/api/admin/coupons'),
    ('套餐管理', '/api/admin/plans'),
    ('文章', '/api/admin/articles'),
    ('通知', '/api/admin/notifications'),
    ('消息模板', '/api/admin/msg-templates'),
    ('快捷回复', '/api/admin/quick-replies'),
    ('规则管理', '/api/admin/rules'),
    ('算命师', '/api/admin/fortune-tellers'),
    ('供奉记录', '/api/admin/offering-records'),
    ('代理财务', '/api/admin/finance-agents'),
    ('收入管理', '/api/admin/revenue'),
    ('用户标签', '/api/admin/tags'),
    ('会员管理', '/api/admin/membership'),
    ('用户资料', '/api/admin/user-profiles'),
    ('积分管理', '/api/admin/points'),
    ('审计日志', '/api/admin/audit'),
    ('百科', '/api/admin/encyclopedia'),
    ('知识库', '/api/admin/kb'),
    ('活动', '/api/admin/campaigns'),
    ('频道', '/api/admin/channels'),
    ('工单', '/api/admin/tickets'),
    ('导出', '/api/admin/exports'),
    ('交易导出', '/api/admin/transactions-export'),
    ('聊天', '/api/admin/chat'),
]

print('\n=== 重新测试之前崩溃的 API ===')
ok = 0
still_fail = 0
for name, path in crash_apis:
    try:
        r = s.get(base + path, timeout=10)
        status = r.status_code
        try:
            d = r.json()
            if isinstance(d, list):
                info = 'list[%d]' % len(d)
            elif isinstance(d, dict):
                if 'error' in d:
                    info = 'ERROR: ' + str(d['error'])[:80]
                else:
                    keys = list(d.keys())[:4]
                    info = 'keys=' + str(keys)
            else:
                info = str(d)[:50]
        except:
            info = r.text[:80]
        icon = '✅' if status == 200 else '❌'
        if status == 200:
            ok += 1
        else:
            still_fail += 1
        print('%s %d %-40s %-15s %s' % (icon, status, path, name, info))
    except Exception as e:
        still_fail += 1
        print('❌ ERR %-40s %-15s %s' % (path, name, str(e)[:60]))

print('\n=== 统计 ===')
print('  ✅ 已修复: %d / %d' % (ok, len(crash_apis)))
print('  ❌ 仍崩溃: %d / %d' % (still_fail, len(crash_apis)))
