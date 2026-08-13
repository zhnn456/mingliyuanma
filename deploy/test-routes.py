"""测试多个路由"""
import urllib.request
import urllib.error

paths = ['/demo', '/demo-home', '/demo-bazi', '/about', '/bazi', '/membership', '/offering']

for path in paths:
    url = f'https://ming8.online{path}'
    try:
        r = urllib.request.urlopen(url)
        print(f'{path}: {r.status}')
    except urllib.error.HTTPError as e:
        print(f'{path}: {e.code}')
    except Exception as e:
        print(f'{path}: ERROR - {e}')
