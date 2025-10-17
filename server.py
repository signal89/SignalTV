from flask import Flask, jsonify, send_from_directory
import requests, json, re, os
from difflib import get_close_matches

app = Flask(__name__)

LISTS_FILE = "lists.txt"
CHANNELS_FILE = "channels.json"
STATIC_DIR = "static"

def load_lists():
    lists = []
    if not os.path.exists(LISTS_FILE):
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

def load_channels():
    if not os.path.exists(CHANNELS_FILE):
        return []
    with open(CHANNELS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def parse_m3u(m3u_text):
    """Vrati dict: naziv_kanala -> URL"""
    channels = {}
    name = None
    for line in m3u_text.splitlines():
        if line.startswith("#EXTINF"):
            m = re.search(r",(.+)$", line)
            if m:
                name = m.group(1).strip()
        elif line.startswith("http"):
            if name:
                channels[name.strip()] = line.strip()
                name = None
    return channels

@app.route("/api/channels")
def api_channels():
    lists = load_lists()
    wanted_channels = load_channels()
    working_channels = []
    stream_map = {}

    # pronađi prvu funkcionalnu listu
    for l in lists:
        try:
            r = requests.get(l["url"], timeout=10)
            if r.status_code == 200 and "#EXTM3U" in r.text:
                stream_map = parse_m3u(r.text)
                break
        except Exception:
            continue

    if not stream_map:
        return jsonify({"error": "Nijedna lista ne radi"}), 500

    # normalizacija ključeva
    def normalize(text):
        return (
            text.lower()
            .replace(" ", "")
            .replace("-", "")
            .replace(".", "")
            .replace("_", "")
            .replace("hd", "")
            .strip()
        )

    normalized_streams = {normalize(k): v for k, v in stream_map.items()}

    for ch in wanted_channels:
        name = ch["name"]
        norm_name = normalize(name)

        url = normalized_streams.get(norm_name)

        # ako nema tačno ime — fuzzy match samo ako je jako slično
        if not url:
            match = get_close_matches(norm_name, normalized_streams.keys(), n=1, cutoff=0.9)
            if match:
                url = normalized_streams[match[0]]

        working_channels.append({
            "name": name,
            "url": url if url else None,
            "logo": ch.get("logo", "/static/default.png"),
            "group": ch.get("group", "Ostalo"),
        })

    return jsonify(working_channels)

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
