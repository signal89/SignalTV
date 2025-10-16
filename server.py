from flask import Flask, jsonify, send_from_directory
import requests, json, re, os
from difflib import get_close_matches

app = Flask(__name__)

LISTS_FILE = "lists.txt"
CHANNELS_FILE = "channels.json"
STATIC_DIR = "static"


def load_lists():
    lists = []
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
    with open(CHANNELS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_m3u(m3u_text):
    """Parsiraj M3U fajl i vrati {ime: url}"""
    channels = {}
    lines = m3u_text.splitlines()
    name = None
    for line in lines:
        if line.startswith("#EXTINF"):
            m = re.search(r",(.+)$", line)
            if m:
                name = m.group(1).strip()
        elif line.startswith("http"):
            if name:
                channels[name] = line.strip()
                name = None
    return channels


@app.route("/api/channels")
def api_channels():
    lists = load_lists()
    wanted_channels = load_channels()
    working_channels = []
    stream_map = {}

    # ✅ Nađi prvu funkcionalnu listu
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

    # ✅ Normalizuj nazive iz M3U
    normalized_streams = {
        k.lower()
         .replace("hd", "")
         .replace("premium", "premium ")
         .replace("  ", " ")
         .replace("(", "")
         .replace(")", "")
         .replace(".", "")
         .replace("-", "")
         .strip(): v
        for k, v in stream_map.items()
    }

    # ✅ Fina logika za grupisanje
    def get_group(name):
        n = name.lower()
        if "arena" in n:
            if "premium" in n:
                return "Arena Premium"
            return "Arena Sport"
        if "sport klub" in n or "sportklub" in n or n.startswith("sk "):
            return "Sport Klub"
        if any(tag in n for tag in ["film", "cinemax", "hbo"]):
            return "Filmski"
        if any(tag in n for tag in ["hrt", "rtl", "nova", "doma", "prva", "pink", "happy"]):
            return "Regionalni"
        return "Ostalo"

    # ✅ Tačno uparivanje po imenu (prije fuzzy match)
    for ch in wanted_channels:
        name = ch["name"]
        norm_name = (
            name.lower()
            .replace("hd", "")
            .replace("premium", "premium ")
            .replace("  ", " ")
            .replace("(", "")
            .replace(")", "")
            .replace(".", "")
            .replace("-", "")
            .strip()
        )

        url = normalized_streams.get(norm_name)
        if not url:
            match = get_close_matches(norm_name, normalized_streams.keys(), n=1, cutoff=0.75)
            if match:
                url = normalized_streams[match[0]]

        if url:
            working_channels.append({
                "name": name,
                "url": url,
                "logo": ch.get("logo", f"/static/default.png"),
                "group": get_group(name)
            })

    if not working_channels:
        return jsonify({"error": "Nema pronađenih kanala"}), 404

    return jsonify(working_channels)


@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
