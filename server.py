from flask import Flask, jsonify, send_from_directory
import requests, time, os, re
from concurrent.futures import ThreadPoolExecutor
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Omogućava pristup sa Expo app-a

LISTS_FILE = "lists.txt"
CACHE_DURATION = 300  # 5 minuta
MAX_WORKERS = 4

cache = {"data": None, "timestamp": 0}


def load_lists():
    lists = []
    if not os.path.exists(LISTS_FILE):
        return lists
    with open(LISTS_FILE, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            if "|" in line:
                name, url = line.split("|", 1)
            else:
                name = f"Lista {i}"
                url = line
            lists.append({"id": i, "name": name.strip(), "url": url.strip()})
    return lists


def quick_parse_for_status(text):
    return "#EXTM3U" in text


def parse_m3u_text(text):
    streams = {}
    cur_name, cur_group, cur_logo = None, "Ostalo", None
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#EXTINF"):
            m_name = re.search(r",\s*(.+)$", line)
            cur_name = m_name.group(1).strip() if m_name else None
            mg = re.search(r'group-title="([^"]+)"', line, re.IGNORECASE)
            cur_group = mg.group(1).strip() if mg else "Ostalo"
            ml = re.search(r'tvg-logo="([^"]+)"', line, re.IGNORECASE)
            cur_logo = ml.group(1).strip() if ml else None
        elif line.startswith(("http", "udp://", "rtmp")):
            if cur_name:
                streams[cur_name] = {"url": line, "group": cur_group, "logo": cur_logo}
            cur_name, cur_group, cur_logo = None, "Ostalo", None
    return streams


def fetch_url(url, timeout=8):
    try:
        r = requests.get(url, timeout=timeout)
        if r.status_code == 200 and quick_parse_for_status(r.text):
            return True, r.text
        return False, None
    except Exception:
        return False, None


def categorize_by_group_name(group_name):
    g = (group_name or "").lower()
    if any(x in g for x in ["film", "movie", "filmovi", "movies"]):
        return "Filmovi"
    if any(x in g for x in ["serij", "series", "episode", "epizod"]):
        return "Serije"
    return "LiveTV"


def test_all_lists(lists):
    status = []

    def check(l):
        ok, _ = fetch_url(l["url"])
        return {"id": l["id"], "name": l["name"], "url": l["url"], "status": "ok" if ok else "fail"}

    if not lists:
        return status

    with ThreadPoolExecutor(max_workers=min(MAX_WORKERS, len(lists))) as ex:
        results = list(ex.map(check, lists))
    return results


def build_channels_structure(lists):
    statuses = test_all_lists(lists)
    working = [s for s in statuses if s["status"] == "ok"]

    if not working:
        return {"status_lists": statuses, "categories": {"LiveTV": {}, "Filmovi": {}, "Serije": {}}}

    combined = {}
    first_done = False

    for s in working:
        ok, txt = fetch_url(s["url"])
        if ok and txt:
            parsed = parse_m3u_text(txt)
            for name, info in parsed.items():
                if name not in combined:
                    combined[name] = info
            if not first_done:
                first_done = True
                # Prva lista koja radi odmah se koristi kao "primary"
                continue

    categories = {"LiveTV": {}, "Filmovi": {}, "Serije": {}}
    for name, info in combined.items():
        cat = categorize_by_group_name(info.get("group", "Ostalo"))
        grp = info.get("group") or "Ostalo"
        categories.setdefault(cat, {})
        categories[cat].setdefault(grp, []).append({
            "name": name,
            "url": info.get("url"),
            "logo": info.get("logo")
        })

    return {"status_lists": statuses, "categories": categories}


@app.route("/api/channels")
def api_channels():
    global cache
    now = time.time()
    if cache["data"] and now - cache["timestamp"] < CACHE_DURATION:
        return jsonify(cache["data"])

    lists = load_lists()
    data = build_channels_structure(lists)
    cache = {"data": data, "timestamp": now}
    return jsonify(data)


@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)


@app.route("/")
def home():
    return "<h3>✅ SignalTV API radi</h3><p><a href='/api/channels'>/api/channels</a></p>"


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
