"""
百度主动推送 - 每日定时任务脚本
从 urls.txt 读取全部 URL，每天推送 10 条（百度新站配额），用状态文件记录进度。
66 个 URL / 每天 10 条 = 7 天推完一轮，之后循环。

用法: python scripts/baidu-push-daily.py
依赖: requests (或 urllib)
"""
import os
import sys
import json
import urllib.request
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URLS_FILE = os.path.join(BASE_DIR, "urls.txt")
STATE_FILE = os.path.join(BASE_DIR, "scripts", ".baidu-push-state.json")
SITE = "https://ming8.online"
TOKEN = "kHx5NPQrsWXcHU0M"
BATCH = 10  # 每日配额

API_URL = f"http://data.zz.baidu.com/urls?site={SITE}&token={TOKEN}"


def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"offset": 0, "last_push": None, "total_pushed": 0}


def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def main():
    # 读取全部 URL（去空行、去重、保持顺序）
    with open(URLS_FILE, "r", encoding="utf-8") as f:
        urls = [line.strip() for line in f if line.strip()]
    urls = list(dict.fromkeys(urls))  # 去重保序
    total = len(urls)
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] URLs 总数: {total}")

    state = load_state()
    offset = state.get("offset", 0)

    # 超界则从头开始（一轮推完，循环）
    if offset >= total:
        offset = 0
        print("本轮已推完，从头开始新一轮")

    batch = urls[offset : offset + BATCH]
    print(f"本次推送 {len(batch)} 条 (offset={offset}):")
    for u in batch:
        print(f"  {u}")

    data = "\n".join(batch).encode("utf-8")
    req = urllib.request.Request(API_URL, data=data, method="POST")
    req.add_header("Content-Type", "text/plain")
    try:
        resp = urllib.request.urlopen(req, timeout=60)
        result = json.loads(resp.read().decode("utf-8"))
        print(f"推送结果: {json.dumps(result, ensure_ascii=False)}")
        return handle_result(result, state, offset, total)
    except urllib.error.HTTPError as he:
        # 400 常为配额耗尽，读取响应体确认
        try:
            body = he.read().decode("utf-8")
            print(f"HTTP {he.code}: {body[:300]}")
            if "over quota" in body or he.code == 400:
                print("⚠️ 配额已用完（HTTP 400/over quota）：进度保持不变，明天 00:30 自动继续")
                return 1
        except Exception:
            pass
        print(f"❌ HTTP {he.code}，未识别为配额问题，进度保持不变")
        return 1
    except Exception as e:
        print(f"❌ 推送异常: {e}")
        return 1


def handle_result(result, state, offset, total):
    success = result.get("success", 0)
    remain = result.get("remain", 0)
    not_valid = result.get("not_valid", [])
    over_quota = result.get("message") == "over quota" or "over quota" in str(result)

    if over_quota:
        print("⚠️ 返回 over quota：今日配额已用完，进度保持不变，明天再试")
        return 1

    if success > 0:
        # 只有成功才推进度（成功条数可能少于10，只推进成功数）
        state["offset"] = offset + success
        state["last_push"] = datetime.now().isoformat()
        state["total_pushed"] = state.get("total_pushed", 0) + success
        save_state(state)
        print(f"✅ 进度更新: offset={state['offset']}/{total}, 累计推送 {state['total_pushed']} 条")

    if not_valid:
        print(f"❌ 无效 URL {len(not_valid)} 条: {not_valid}")

    if remain <= 0:
        print("今日配额已用完，明天继续")
    return 0


if __name__ == "__main__":
    sys.exit(main())
