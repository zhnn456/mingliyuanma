# 从 Wikimedia Commons 搜索并下载可商用（CC0/公有领域）的传统文化主题图片
import urllib.request, urllib.parse, json, os, sys

UA = {'User-Agent': 'MingliWeb/1.0 (compliance image search; contact: admin@ming8.online)'}

def api(params):
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

def search_files(query, limit=15):
    """搜索文件并返回 (title, license, thumb_url) 列表，只保留 CC0/公有领域"""
    data = api({
        'action': 'query', 'list': 'search', 'srnamespace': '6',
        'srsearch': query, 'srlimit': str(limit), 'format': 'json',
    })
    results = []
    for item in data.get('query', {}).get('search', []):
        title = item['title']
        if not title.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        # 查许可证与缩略图 URL
        try:
            info = api({
                'action': 'query', 'titles': title, 'prop': 'imageinfo',
                'iiprop': 'url|extmetadata', 'iiurlwidth': '1200', 'format': 'json',
            })
            pages = info['query']['pages']
            for _, pg in pages.items():
                if 'imageinfo' not in pg:
                    continue
                ii = pg['imageinfo'][0]
                meta = ii.get('extmetadata', {})
                lic = meta.get('LicenseShortName', {}).get('value', '')
                # 只收 CC0 / 公有领域
                if any(k in lic for k in ['CC0', 'Public domain', 'public domain', 'PD-old']):
                    results.append({'title': title, 'license': lic, 'url': ii.get('thumburl') or ii.get('url')})
        except Exception as e:
            print(f'  (skip {title}: {e})')
    return results

def download(url, path):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r, open(path, 'wb') as f:
        f.write(r.read())
    return os.path.getsize(path)

OUT = r'f:\mingliyuanma\public\images\knowledge\categories'
os.makedirs(OUT, exist_ok=True)

tasks = [
    ('taiji yin yang symbol', 'basic.jpg'),
    ('chinese calligraphy brush ink', 'bazi.jpg'),
    ('night sky stars milky way', 'ziwei.jpg'),
    ('chinese compass luopan feng shui', 'qimen.jpg'),
    ('plum blossom branch', 'meihua.jpg'),
]

for query, fname in tasks:
    print(f'\n=== 搜索: {query} ===')
    try:
        found = search_files(query)
        if not found:
            print('  未找到 CC0/PD 图片')
            continue
        for f in found[:3]:
            print(f"  {f['license']} | {f['title']}")
        best = found[0]
        path = os.path.join(OUT, fname)
        try:
            size = download(best['url'], path)
            print(f"  ✅ 已下载 {fname} ({size//1024}KB) <- {best['title']} [{best['license']}]")
        except Exception as e:
            print(f"  ❌ 下载失败: {e}")
    except Exception as e:
        print(f'  ❌ 搜索失败: {e}')
