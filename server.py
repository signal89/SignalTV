# server.py
from flask import Flask, jsonify, send_from_directory
import requests, json, re, os
from difflib import SequenceMatcher, get_close_matches

app = Flask(__name__)

LISTS_FILE = "lists.txt"
CHANNELS_FILE = "channels.json"
STATIC_DIR = "static"
DEFAULT_LOGO = "/static/default.png"

# -------------------------
# HELPERS
# -------------------------
def load_lists():
    lists = []
    if not os.path.exists(LISTS_FILE):
        print("⚠️ Nema fajla lists.txt!")
        return lists
    with open(LISTS_FILE, "r", encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            if " | " in line:
                name, url = line.split(" | ", 1)
            else:
                name, url = f"Lista {i}", line
            lists.append({"id": i, "name": name.strip(), "url": url.strip()})
    return lists

def load_wanted_channels():
    if not os.path.exists(CHANNELS_FILE):
        print("⚠️ Nema channels.json fajla!")
        return []
    try:
        with open(CHANNELS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print("❌ Greška pri učitavanju channels.json:", e)
        return []

def normalize(name: str):
    if not name:
        return ""
    s = name.lower()
    repl = [("š","s"),("č","c"),("ć","c"),("ž","z"),("đ","dj"),(".", ""),(",", ""),("premium","premijum")]
    for a, b in repl:
        s = s.replace(a,b)
    s = re.sub(r'[^a-z0-9 ]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()

def parse_m3u_text(text):
    streams = {}
    cur_name, cur_group, cur_logo = None, "Ostalo", None
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("#EXTINF"):
            m_name = re.search(r',\s*(.+)$', line)
            m_group = re.search(r'group-title="([^"]+)"', line, re.IGNORECASE)
            m_logo = re.search(r'tvg-logo="([^"]+)"', line, re.IGNORECASE)
            cur_name = m_name.group(1).strip() if m_name else None
            cur_group = m_group.group(1).strip() if m_group else "Ostalo"
            cur_logo = m_logo.group(1).strip() if m_logo else None
        elif line.startswith(("http", "rtmp", "udp://")):
            if cur_name:
                streams[cur_name] = {"url": line, "group": cur_group, "logo": cur_logo}
                cur_name = None
    return streams

def fetch_and_parse(url):
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200 and "#EXTM3U" in r.text:
            parsed = parse_m3u_text(r.text)
            print(f"[OK lista] {url} -> {len(parsed)} kanala")
            return parsed
    except Exception as e:
        print(f"[Greška lista] {url} -> {e}")
    return {}

# -------------------------
# MAIN BUILDER
# -------------------------
def build_channel_map():
    lists = load_lists()
    wanted = load_wanted_channels()
    if not lists:
        print("⚠️ Nema lists.txt")
        return {}

    # pronađi prvu radnu listu
    all_streams = []
    for l in lists:
        parsed = fetch_and_parse(l["url"])
        if parsed:
            all_streams.append(parsed)

    if not all_streams:
        print("❌ Nijedna lista nije radna")
        return {}

    grouped = {}

    for ch in wanted:
        cname = ch.get("name", "")
        cgroup = ch.get("group", "Ostalo")
        clog = ch.get("logo") or DEFAULT_LOGO

        n_want = normalize(cname)
        best_url = None
        best_logo = None

        # traži kroz sve radne liste dok ne nađe najbolji match
        best_ratio = 0.0
        for streams in all_streams:
            for sname, sinfo in streams.items():
                n_src = normalize(sname)
                ratio = similar(n_want, n_src)
                if n_want in n_src or n_src in n_want:
                    ratio += 0.3
                if ratio > best_ratio and ratio >= 0.55:
                    best_ratio = ratio
                    best_url = sinfo.get("url")
                    best_logo = sinfo.get("logo")

        grouped.setdefault(cgroup, []).append({
            "name": cname,
            "url": best_url,
            "logo": best_logo or clog or DEFAULT_LOGO,
            "status": "ok" if best_url else "nedostupan"
        })

    return grouped

# -------------------------
# ROUTES
# -------------------------
@app.route("/api/channels")
def api_channels():
    grouped = build_channel_map()
    return jsonify([{"group": g, "channels": grouped[g]} for g in grouped])

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
