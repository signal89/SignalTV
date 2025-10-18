from flask import Flask, jsonify, send_from_directory
import requests, json, re, os
from difflib import get_close_matches

app = Flask(__name__)

LISTS_FILE = "lists.txt"
CHANNELS_FILE = "channels.json"
STATIC_DIR = "static"


def load_lists():
    """Učitaj sve liste iz lists.txt fajla"""
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


def load_channels():
    """Učitaj željene kanale iz channels.json fajla"""
    if not os.path.exists(CHANNELS_FILE):
        print("⚠️ Nema channels.json fajla!")
        return []
    try:
        with open(CHANNELS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            print(f"📺 Učitano {len(data)} željenih kanala.")
            return data
    except Exception as e:
        print(f"❌ Greška pri čitanju {CHANNELS_FILE}: {e}")
        return []


def parse_m3u(m3u_text):
    """Parsira M3U tekst u dict: {naziv_kanala: url}"""
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

    # 🔁 Pokušaj svaku listu (timeout=5s)
    for l in lists:
        try:
            print(f"🔍 Provjeravam listu: {l['url']}")
            r = requests.get(l["url"], timeout=5)
            if r.status_code == 200 and "#EXTM3U" in r.text:
                stream_map = parse_m3u(r.text)
                print(f"✅ Lista radi: {l['name']} ({len(stream_map)} kanala pronađeno)")
                break
        except Exception as e:
            print(f"⚠️ Greška na listi {l['url']}: {e}")
            continue

    if not stream_map:
        print("⚠️ Nema funkcionalnih lista, vraćam prazan niz.")
        return jsonify([])

    # 🔍 Pametnija normalizacija (čuva premium, hd, hr, sr, bih itd.)
    def normalize(name):
        return (
            name.lower()
            .replace(" ", "")
            .replace("-", "")
            .replace(".", "")
            .replace("_", "")
            .replace("(", "")
            .replace(")", "")
            .replace("channel", "")
            .replace("kanal", "")
            .strip()
        )

    normalized_streams = {normalize(k): v for k, v in stream_map.items()}

    for ch in wanted_channels:
        name = ch["name"]
        norm_name = normalize(name)
        url = normalized_streams.get(norm_name)

        # ako nije nađen tačan naziv — fuzzy pretraga
        if not url:
            candidates = get_close_matches(norm_name, normalized_streams.keys(), n=3, cutoff=0.8)
            if candidates:
                # prioritet: sadrži premium/hr/sr/bih ako i original ima
                keywords = ["premium", "hd", "hr", "sr", "bih", "4k", "fight"]
                best_match = None
                for c in candidates:
                    if all(k in c for k in keywords if k in norm_name):
                        best_match = c
                        break
                if not best_match:
                    best_match = candidates[0]
                url = normalized_streams.get(best_match)

        working_channels.append({
            "name": name,
            "url": url if url else None,
            "logo": ch.get("logo", "/static/default.png"),
            "group": ch.get("group", "Ostalo"),
            "status": "ok" if url else "nedostupan"
        })

    print(f"✅ Ukupno pronađeno: {sum(1 for c in working_channels if c['url'])} od {len(working_channels)} kanala.")
    return jsonify(working_channels)


@app.route("/static/<path:filename>")
def static_files(filename):
    """Serviraj slike i logoe"""
    return send_from_directory(STATIC_DIR, filename)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
