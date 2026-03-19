from flask import Flask, jsonify, send_from_directory
import requests
import time
import os
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

LISTS_FILE = "lists.txt"
CACHE_DURATION = 300

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

            lists.append({
                "id": i,
                "name": name.strip(),
                "url": url.strip()
            })

    return lists


def quick_parse_for_status(text):
    return "#EXTM3U" in text


def parse_m3u_text(text):
    streams = []
    cur_name = None
    cur_group = "Ostalo"
    cur_logo = None
    cur_tvg_id = None
    cur_tvg_name = None

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

            mi = re.search(r'tvg-id="([^"]+)"', line, re.IGNORECASE)
            cur_tvg_id = mi.group(1).strip() if mi else None

            mn = re.search(r'tvg-name="([^"]+)"', line, re.IGNORECASE)
            cur_tvg_name = mn.group(1).strip() if mn else None

        elif line.startswith(("http://", "https://", "udp://", "rtmp://", "rtsp://")):
            if cur_name:
                streams.append({
                    "name": cur_name,
                    "url": line,
                    "group": cur_group,
                    "logo": cur_logo,
                    "tvg_id": cur_tvg_id,
                    "tvg_name": cur_tvg_name,
                })

            cur_name = None
            cur_group = "Ostalo"
            cur_logo = None
            cur_tvg_id = None
            cur_tvg_name = None

    return streams


def fetch_playlist(url, timeout=4):
    try:
        r = requests.get(url, timeout=timeout, allow_redirects=True)
        if r.status_code == 200 and quick_parse_for_status(r.text):
            return True, r.text
        return False, None
    except Exception:
        return False, None


def test_stream_url(url, timeout=3):
    try:
        r = requests.get(url, stream=True, timeout=timeout, allow_redirects=True)
        code = r.status_code
        r.close()
        return code in (200, 206)
    except Exception:
        return False


def is_playlist_usable(parsed_streams, sample_size=2):
    urls = []

    for info in parsed_streams:
        u = info.get("url")
        if u and u.startswith(("http://", "https://")):
            urls.append(u)
        if len(urls) >= sample_size:
            break

    if not urls:
        return False

    for u in urls:
        if test_stream_url(u):
            return True

    return False


def has_year_in_title(name):
    if not name:
        return False
    return re.search(r"\b(19\d{2}|20\d{2})\b", name) is not None


def looks_like_episode(name):
    if not name:
        return False

    patterns = [
        r"\bS\d{1,2}E\d{1,3}\b",
        r"\bS\d{1,2}\b",
        r"\bE\d{1,3}\b",
        r"\bSEASON\s*\d{1,2}\b",
        r"\bEPISODE\s*\d{1,3}\b",
        r"\bEP\s*\d{1,3}\b",
        r"\bSEZONA\s*\d{1,2}\b",
        r"\bEPIZODA\s*\d{1,3}\b",
    ]

    upper_name = name.upper()
    return any(re.search(p, upper_name) for p in patterns)


def detect_category(group_name, channel_name, tvg_id=None, tvg_name=None):
    g = (group_name or "").lower()
    n = (channel_name or "").lower()
    t = (tvg_name or "").lower()
    text = f"{g} {n} {t}"

    series_keywords = [
        "series", "serie", "serije", "serija", "season", "sezona",
        "episode", "epizod", "episodes", "seasons"
    ]

    movie_keywords = [
        "movie", "movies", "film", "filmovi", "cinema", "kino",
        "vod", "videoteka", "peliculas", "filme", "filmy"
    ]

    live_keywords = [
        "live", "tv", "sport", "sports", "news", "documentary",
        "kids", "music", "adult", "france", "germany", "deutschland",
        "balkan", "ex-yu", "usa", "uk", "italy", "arena", "hbo", "sky"
    ]

    if any(x in text for x in series_keywords):
        return "Serije"

    if looks_like_episode(channel_name) or looks_like_episode(tvg_name):
        return "Serije"

    if any(x in text for x in movie_keywords):
        return "Filmovi"

    if has_year_in_title(channel_name) and not looks_like_episode(channel_name):
        return "Filmovi"

    if tvg_id and not any(x in text for x in movie_keywords + series_keywords):
        return "LiveTV"

    if any(x in g for x in live_keywords):
        return "LiveTV"

    if any(x in n for x in [" tv", " hd", " fhd", " uhd", " 4k"]):
        return "LiveTV"

    return "LiveTV"


def normalize_group_name(group_name, category):
    grp = (group_name or "").strip()
    low = grp.lower()

    empty_names = ["", "ostalo", "other", "others", "---"]

    if category == "Filmovi":
        if low in empty_names:
            return "Filmovi"
        return grp

    if category == "Serije":
        if low in empty_names:
            return "Serije"
        return grp

    if low in empty_names:
        return "LiveTV"

    return grp


def build_channels_structure(lists):
    statuses = []
    selected_list = None
    selected_streams = []

    for l in lists:
        ok, txt = fetch_playlist(l["url"])

        if not ok or not txt:
            statuses.append({
                "id": l["id"],
                "name": l["name"],
                "url": l["url"],
                "status": "fail",
                "reason": "playlist_unreachable"
            })
            continue

        parsed = parse_m3u_text(txt)

        if not parsed:
            statuses.append({
                "id": l["id"],
                "name": l["name"],
                "url": l["url"],
                "status": "fail",
                "reason": "playlist_empty"
            })
            continue

        usable = is_playlist_usable(parsed, sample_size=2)

        if not usable:
            statuses.append({
                "id": l["id"],
                "name": l["name"],
                "url": l["url"],
                "status": "fail",
                "reason": "streams_unusable"
            })
            continue

        selected_list = l
        selected_streams = parsed
        statuses.append({
            "id": l["id"],
            "name": l["name"],
            "url": l["url"],
            "status": "ok",
            "reason": "selected"
        })
        break

    if selected_list is None:
        empty = {"LiveTV": {}, "Filmovi": {}, "Serije": {}}
        return {
            "status_lists": statuses,
            "active_list": None,
            "categories": empty
        }

    categories = {"LiveTV": {}, "Filmovi": {}, "Serije": {}}

    for info in selected_streams:
        name = info.get("name", "")
        category = detect_category(
            info.get("group", ""),
            name,
            info.get("tvg_id"),
            info.get("tvg_name"),
        )
        group_name = normalize_group_name(info.get("group", ""), category)

        categories.setdefault(category, {})
        categories[category].setdefault(group_name, []).append({
            "name": name,
            "url": info.get("url"),
            "logo": info.get("logo"),
        })

    for cat in categories:
        for grp in categories[cat]:
            categories[cat][grp].sort(key=lambda x: (x.get("name") or "").lower())

    return {
        "status_lists": statuses,
        "active_list": {
            "id": selected_list["id"],
            "name": selected_list["name"],
            "url": selected_list["url"]
        },
        "categories": categories
    }


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


@app.route("/api/refresh")
def api_refresh():
    global cache
    cache = {"data": None, "timestamp": 0}
    return jsonify({"ok": True, "message": "Cache cleared"})


@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)


@app.route("/")
def home():
    return "✅ SignalTV API radi /api/channels"


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
