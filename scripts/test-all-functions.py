"""深入测试所有管理后台功能 - 包括写操作"""
import requests, sys, json, time
sys.stdout.reconfigure(encoding='utf-8')

# 登录中央站
print('=== 登录中央站 ===')
s = requests.Session()
login_data = {'email': '282063152@qq.com', 'password': 'Admin@2026!'}
res = s.post('https://ming8.online/api/auth/login', json=login_data, timeout=15)
print('登录:', res.status_code, res.json().get('user', {}).get('role', ''))

if res.status_code != 200:
    sys.exit(1)

base = 'https://ming8.online'

# ==================== GET API 测试（所有管理后台 API）====================
print('\n' + '='*60)
print('  GET API 测试 - 所有管理后台功能')
print('='*60)

get_apis = [
    # 核心功能
    ('统计面板', '/api/admin/stats'),
    ('用户管理', '/api/admin/users'),
    ('订单管理', '/api/admin/orders'),
    ('系统配置', '/api/admin/config'),
    ('支付配置', '/api/admin/payment-config'),
    ('品牌设置', '/api/admin/brand-settings'),
    # 商品/优惠
    ('优惠券', '/api/admin/coupons'),
    ('套餐管理', '/api/admin/plans'),
    # 代理商
    ('代理商', '/api/admin/agents'),
    ('代理健康', '/api/admin/agent-health'),
    ('代理审核', '/api/admin/agent-review'),
    ('代理统计', '/api/admin/agent-stats'),
    ('代理结算', '/api/admin/agent-settlement'),
    ('授权码', '/api/admin/licenses'),
    # 卡密
    ('卡密管理', '/api/admin/card-keys'),
    # 内容
    ('公告', '/api/admin/announcement'),
    ('文章', '/api/admin/articles'),
    ('横幅', '/api/admin/banners'),
    ('通知', '/api/admin/notifications'),
    ('消息模板', '/api/admin/msg-templates'),
    ('快捷回复', '/api/admin/quick-replies'),
    # 命理
    ('紫微斗数', '/api/admin/ziwei'),
    ('奇门遁甲', '/api/admin/qimen'),
    ('梅花易数', '/api/admin/meihua'),
    ('排盘记录', '/api/admin/records'),
    ('规则管理', '/api/admin/rules'),
    ('算命师', '/api/admin/fortune-tellers'),
    # 供奉
    ('供奉管理', '/api/admin/offering'),
    ('供奉物品', '/api/admin/offering-items'),
    ('供奉记录', '/api/admin/offering-records'),
    # 财务
    ('财务管理', '/api/admin/finance'),
    ('财务报表', '/api/admin/finance-reports'),
    ('代理财务', '/api/admin/finance-agents'),
    ('收入管理', '/api/admin/revenue'),
    ('结算管理', '/api/admin/settlements'),
    ('佣金管理', '/api/admin/commissions'),
    ('佣金规则', '/api/admin/commission-rules'),
    ('佣金记录', '/api/admin/commission-records'),
    ('提现管理', '/api/admin/withdrawals'),
    # 用户管理
    ('用户标签', '/api/admin/tags'),
    ('黑名单', '/api/admin/blacklist'),
    ('会员管理', '/api/admin/membership'),
    ('用户资料', '/api/admin/user-profiles'),
    ('积分管理', '/api/admin/points'),
    # 系统
    ('审计日志', '/api/admin/audit'),
    ('更新公告', '/api/admin/updates'),
    ('更新日志', '/api/admin/update-logs'),
    ('版本管理', '/api/version/release'),
    # 其他
    ('百科', '/api/admin/encyclopedia'),
    ('知识库', '/api/admin/kb'),
    ('活动', '/api/admin/campaigns'),
    ('频道', '/api/admin/channels'),
    ('联系消息', '/api/admin/contact-messages'),
    ('工单', '/api/admin/tickets'),
    ('物资', '/api/admin/supplies'),
    ('导出', '/api/admin/exports'),
    ('交易导出', '/api/admin/transactions-export'),
    ('退款', '/api/admin/refunds'),
    ('支付记录', '/api/admin/payments'),
    ('聊天', '/api/admin/chat'),
]

results = {}
for name, path in get_apis:
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
        icon = '✅' if status == 200 else ('❌' if status >= 500 else '⚠️')
        results[path] = status
        print('%s %d %-40s %-20s %s' % (icon, status, path, name, info))
    except Exception as e:
        results[path] = -1
        print('❌ ERR %-40s %-20s %s' % (path, name, str(e)[:60]))

# 统计
ok = sum(1 for v in results.values() if v == 200)
fail = sum(1 for v in results.values() if v >= 500)
warn = sum(1 for v in results.values() if 200 < v < 500)
err = sum(1 for v in results.values() if v < 0)
print('\n=== 统计 ===')
print('  ✅ 正常: %d' % ok)
print('  ❌ 崩溃: %d' % fail)
print('  ⚠️ 警告: %d' % warn)
print('  ❓ 错误: %d' % err)
print('  总计: %d' % len(results))

# ==================== 崩溃 API 错误详情 ====================
print('\n' + '='*60)
print('  崩溃 API 错误详情')
print('='*60)

crash_apis = [path for path, status in results.items() if status >= 500]
for path in crash_apis:
    print('\n--- %s ---' % path)
    r = s.get(base + path, timeout=10)
    print(r.text[:500])

# ==================== POST 写操作测试 ====================
print('\n' + '='*60)
print('  POST 写操作测试')
print('='*60)

post_tests = [
    ('优惠券-创建', '/api/admin/coupons', {
        'code': 'TEST_COUPON_' + str(int(time.time())),
        'discountType': 'amount',
        'discountValue': 10,
        'minAmount': 0,
        'totalCount': 100,
        'expiryAt': '2026-12-31T23:59:59Z',
    }),
    ('套餐-创建', '/api/admin/plans', {
        'name': '测试套餐',
        'price': 99,
        'duration': 30,
        'features': ['测试功能'],
    }),
    ('公告-创建', '/api/admin/announcement', {
        'title': '测试公告',
        'content': '这是一个测试公告',
        'category': '新增',
        'isPublished': True,
    }),
    ('卡密-生成', '/api/admin/card-keys', {
        'action': 'generate',
        'count': 5,
        'value': 100,
        'validDays': 30,
    }),
]

for name, path, data in post_tests:
    try:
        r = s.post(base + path, json=data, timeout=10)
        status = r.status_code
        try:
            d = r.json()
            info = json.dumps(d, ensure_ascii=False)[:150]
        except:
            info = r.text[:150]
        icon = '✅' if status == 200 else ('❌' if status >= 500 else '⚠️')
        print('%s %d %-30s %s' % (icon, status, name, info))
    except Exception as e:
        print('❌ ERR %-30s %s' % (name, str(e)[:60]))

print('\n=== 测试完成 ===')
