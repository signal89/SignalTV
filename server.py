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
            # Izvuci ime kanala
            m = re.search(r",(.+)$", line)
            if m:
                name = m.group(1).strip()
        elif line.startswith("http"):
            if name:
                channels[name] = line.strip()
                name = None
    return channels


# 🔹 API endpoint koji vraća sve liste iz lists.txt
@app.route("/api/lists", methods=["GET"])
def get_lists():
    try:
        lists = []
        with open(LISTS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                if "|" in line:
                    name, url = line.strip().split("|", 1)
                    lists.append({"name": name.strip(), "url": url.strip()})
        return jsonify(lists), 200
    except Exception as e:
        app.logger.error(f"Failed to read lists.txt: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/channels")
def api_channels():
    lists = load_lists()
    wanted_channels = load_channels()

    working_channels = []
    stream_map = {}

    # 🔹 Nađi prvu listu koja radi
    for l in lists:
        try:
            r = requests.get(l["url"], timeout=10)
            if r.status_code == 200 and "#EXTM3U" in r.text:
                stream_map = parse_m3u(r.text)
                break
        except Exception:
            continue

    # 🔹 Ako nema radne liste
    if not stream_map:
        return jsonify({"error": "Nijedna lista ne radi"}), 500

    # 🔹 Normalizuj nazive iz M3U liste
    normalized_streams = {
        k.lower()
         .replace("hd", "")
         .replace("  ", " ")
         .replace("(", "")
         .replace(")", "")
         .replace(".", "")
         .replace("-", "")
         .strip(): v
        for k, v in stream_map.items()
    }

    # 🔹 Upari željene kanale po sličnosti (fuzzy match)
    for ch in wanted_channels:
        name = ch["name"]
        norm_name = (
            name.lower()
            .replace("hd", "")
            .replace("  ", " ")
            .replace("(", "")
            .replace(")", "")
            .replace(".", "")
            .replace("-", "")
            .strip()
        )

        # Pronađi najsličnije ime (ako postoji)
        match = get_close_matches(norm_name, normalized_streams.keys(), n=1, cutoff=0.6)
        if match:
            matched_name = match[0]
            working_channels.append({
                "name": name,
                "url": normalized_streams[matched_name],
                "logo": ch.get("logo", "/static/default.png"),
                "group": ch.get("group", "Ostalo")
            })

    if not working_channels:
        return jsonify({"error": "Nema pronađenih kanala"}), 404

    return jsonify(working_channels)


# 🔹 Serviraj slike iz static foldera
@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)


if __name__ == "__main__":
    print("✅ SignalTV server start. Open http://127.0.0.1:5000/api/lists")
    app.run(debug=True, host="0.0.0.0", port=5000)
