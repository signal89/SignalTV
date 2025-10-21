# server.py
from flask import Flask, jsonify, send_from_directory, request
import requests, json, re, os
from difflib import get_close_matches

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

def parse_m3u_text(text):
    streams = {}
    cur_name = None
    cur_group = "Ostalo"
    cur_logo = None
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#EXTINF"):
            m_name = re.search(r',\s*(.+)$', line)
            cur_name = m_name.group(1).strip() if m_name else None
            m_group = re.search(r'group-title="([^"]+)"', line, re.IGNORECASE)
            cur_group = m_group.group(1).strip() if m_group else "Ostalo"
            m_logo = re.search(r'tvg-logo="([^"]+)"', line, re.IGNORECASE)
            cur_logo = m_logo.group(1).strip() if m_logo else None
        elif line.startswith("http") or line.startswith("rtmp") or line.startswith("udp://"):
            if cur_name:
                streams[cur_name] = {
                    "url": line,
                    "group": cur_group,
                    "logo": cur_logo
                }
            cur_name = None
            cur_group = "Ostalo"
            cur_logo = None
    return streams

def fetch_and_parse(url, timeout=10):
    try:
        r = requests.get(url, timeout=timeout)
        if r.status_code == 200 and "#EXTM3U" in r.text:
            parsed = parse_m3u_text(r.text)
            print(f"[fetch] {url} -> {len(parsed)} entries")
            return parsed
    except Exception as e:
        print(f"[fetch error] {url} -> {e}")
    return {}

def normalize(name: str):
    if not name:
        return ""
    s = name.lower()
    # replace diacritics
    for a, b in [("š","s"),("č","c"),("ć","c"),("ž","z"),("đ","dj")]:
        s = s.replace(a,b)
    # remove punctuation but keep words
    s = re.sub(r'[^a-z0-9 ]+', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def find_best_match(norm_want, keys_list, cutoff=0.65):
    """Use difflib to find close match; fallback to substring heuristics."""
    # exact match
    if norm_want in keys_list:
        return norm_want
    # difflib
    matches = get_close_matches(norm_want, keys_list, n=1, cutoff=cutoff)
    if matches:
        return matches[0]
    # token subset: if all tokens of want appear in candidate
    want_tokens = set(norm_want.split())
    for k in keys_list:
        k_tokens = set(k.split())
        if want_tokens and want_tokens.issubset(k_tokens):
            return k
    # last try: candidate tokens subset of want (handles reversed order)
    for k in keys_list:
        if set(k.split()).issubset(want_tokens):
            return k
    return None

def choose_logo(channel_logo_from_json, stream_logo):
    # prefer static if exists locally
    if channel_logo_from_json:
        if channel_logo_from_json.startswith("/static/"):
            local_path = channel_logo_from_json.lstrip("/")
            if os.path.exists(local_path):
                return channel_logo_from_json
            else:
                # file not present locally; still return the path - caller can decide
                return channel_logo_from_json
        else:
            return channel_logo_from_json
    if stream_logo:
        return stream_logo
    return DEFAULT_LOGO

# -------------------------
# BUILD MAP
# -------------------------
def build_channel_map():
    lists = load_lists()
    wanted = load_wanted_channels()

    if not lists:
        print("⚠️ lists.txt prazna")
        return {}

    # 1) find first working list (primary)
    primary_streams = {}
    working_urls = []
    primary_idx = None
    for idx, l in enumerate(lists):
        parsed = fetch_and_parse(l["url"])
        if parsed:
            primary_streams = parsed
            working_urls.append(l["url"])
            primary_idx = idx
            print(f"[primary] using {l['url']}")
            break
        else:
            print(f"[skip] {l['url']} not working")

    if primary_idx is None:
        # no primary found: try to gather any working lists; if none -> empty
        for l in lists:
            parsed = fetch_and_parse(l["url"])
            if parsed:
                working_urls.append(l["url"])
        if not working_urls:
            print("❌ Nijedna lista ne radi")
            return {}
        primary_streams = fetch_and_parse(working_urls[0])
        primary_idx = next((i for i, x in enumerate(lists) if x["url"] == working_urls[0]), 0)
        print(f"[fallback primary] using {working_urls[0]}")

    # 2) build combined map: normalized_name -> {orig_name, url, group, logo}
    combined = {}
    # first take primary streams (priority)
    for name, info in primary_streams.items():
        nk = normalize(name)
        combined[nk] = {
            "orig_name": name,
            "url": info.get("url"),
            "group": info.get("group", "Ostalo"),
            "logo": info.get("logo")
        }

    # then scan other lists to fill missing keys (but don't overwrite existing)
    for l in lists:
        if l["url"] == lists[primary_idx]["url"]:
            continue
        parsed = fetch_and_parse(l["url"])
        if not parsed:
            continue
        for name, info in parsed.items():
            nk = normalize(name)
            if nk not in combined:
                combined[nk] = {
                    "orig_name": name,
                    "url": info.get("url"),
                    "group": info.get("group", "Ostalo"),
                    "logo": info.get("logo")
                }

    # prepare list of available normalized keys once
    available_keys = list(combined.keys())

    # 3) map wanted channels
    grouped = {}
    for ch in wanted:
        want_name = ch.get("name", "")
        want_group = ch.get("group", "Ostalo")
        want_logo = ch.get("logo") or None

        nk = normalize(want_name)
        matched_key = None

        # try direct normalized lookup
        if nk in combined:
            matched_key = nk
        else:
            # fuzzy / tolerant match
            matched_key = find_best_match(nk, available_keys, cutoff=0.65)

        if matched_key:
            stream = combined[matched_key]
            url = stream.get("url")
            status = "ok" if url else "nedostupan"
            final_logo = choose_logo(want_logo, stream.get("logo"))
        else:
            url = None
            status = "nedostupan"
            final_logo = choose_logo(want_logo, None)

        item = {
            "name": want_name,
            "url": url,
            "logo": final_logo,
            "status": status
        }
        grouped.setdefault(want_group or "Ostalo", []).append(item)

    return grouped

# -------------------------
# ROUTES
# -------------------------
@app.route("/api/channels")
def api_channels():
    grouped = build_channel_map()
    out = [{"group": g, "channels": grouped[g]} for g in grouped]
    return jsonify(out)

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
