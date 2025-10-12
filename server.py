from flask import Flask, jsonify, send_from_directory
import requests, json, re, os, time
from difflib import SequenceMatcher

app = Flask(__name__)

LISTS_FILE = "lists.txt"
CHANNELS_FILE = "channels.json"
STATIC_DIR = "static"


def load_lists():
    """Učitava sve M3U linkove iz lists.txt"""
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
    """Učitava JSON kanal listu (ime + logo + grupa)"""
    with open(CHANNELS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_m3u(m3u_text):
    """Parsira M3U listu u ime + URL"""
    channels = []
    lines = m3u_text.splitlines()
    name = None
    for line in lines:
        if line.startswith("#EXTINF"):
            m = re.search(r",(.+)$", line)
            if m:
                name = m.group(1).strip()
        elif line.startswith("http"):
            if name:
                channels.append({"name": name, "url": line.strip()})
                name = None
    return channels


def normalize(text):
    """Jednostavno čišćenje naziva kanala"""
    return (
        text.lower()
        .replace("hd", "")
        .replace("plus", "")
        .replace("premium", "")
        .replace("bih", "")
        .replace("hr", "")
        .replace("sr", "")
        .replace("(", "")
        .replace(")", "")
        .replace(".", "")
        .replace("-", "")
        .strip()
    )


def find_best_match(name, stream_list):
    """Pronađi najbolji link iz M3U liste po sličnosti"""
    best_match = None
    best_score = 0
    for s in stream_list:
        score = SequenceMatcher(None, normalize(name), normalize(s["name"])).ratio()
        if score > best_score:
            best_score = score
            best_match = s
    if best_score >= 0.75:
        return best_match
    return None


@app.route("/api/channels")
def api_channels():
    lists = load_lists()
    wanted_channels = load_channels()
    stream_list = []

    # 🔹 Pronađi prvu aktivnu M3U listu
    for l in lists:
        try:
            print(f"➡️ Testiram {l['name']} ...")
            r = requests.get(l["url"], timeout=10)
            if r.status_code == 200 and "#EXTM3U" in r.text:
                stream_list = parse_m3u(r.text)
                print(f"✅ Koristim {l['name']}")
                break
        except Exception as e:
            print(f"❌ {l['name']} greška: {e}")
            continue

    if not stream_list:
        return jsonify({"error": "Nijedna M3U lista nije dostupna"}), 500

    # 🔹 Poveži kanale
    rezultat = []
    for ch in wanted_channels:
        name = ch["name"]
        match = find_best_match(name, stream_list)
        if match:
            rezultat.append({
                "name": name,
                "url": match["url"],
                "logo": ch.get("logo", "/static/default.png"),
                "group": ch.get("group", "Ostalo")
            })
        else:
            rezultat.append({
                "name": name,
                "url": "Nije dostupno",
                "logo": ch.get("logo", "/static/default.png"),
                "group": ch.get("group", "Ostalo")
            })

    return jsonify(rezultat)


@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
