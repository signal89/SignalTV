# server.py
from flask import Flask, jsonify, send_from_directory
import requests, json, re, os, time

app = Flask(__name__)

LISTS_FILE = "lists.txt"
CHANNELS_FILE = "channels.json"
STATIC_DIR = "static"
DEFAULT_LOGO = "/static/default.png"

# -------------------------
# Učitaj lists.txt
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

# -------------------------
# Učitaj channels.json
# -------------------------
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

# -------------------------
# Parsiranje M3U linija
# -------------------------
def parse_m3u_text(text):
    streams = {}
    current_name = None
    current_group = "Ostalo"
    current_logo = None

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue

        if line.startswith("#EXTINF"):
            m_name = re.search(r',(.+)$', line)
            current_name = m_name.group(1).strip() if m_name else None

            m_group = re.search(r'group-title="([^"]+)"', line, re.IGNORECASE)
            current_group = m_group.group(1).strip() if m_group else "Ostalo"

            m_logo = re.search(r'tvg-logo="([^"]+)"', line, re.IGNORECASE)
            current_logo = m_logo.group(1).strip() if m_logo else None

        elif line.startswith("http") or line.startswith("rtmp") or line.startswith("udp://"):
            if current_name:
                streams[current_name] = {
                    "url": line,
                    "group": current_group,
                    "logo": current_logo or DEFAULT_LOGO
                }
            current_name = None
            current_group = "Ostalo"
            current_logo = None
    return streams

# -------------------------
# Dohvati i parsiraj listu
# -------------------------
def fetch_and_parse(url, timeout=10):
    try:
        r = requests.get(url, timeout=timeout)
        if r.status_code == 200 and "#EXTM3U" in r.text:
            parsed = parse_m3u_text(r.text)
            print(f"✅ Učitano {len(parsed)} kanala sa {url}")
            return parsed
        else:
            print(f"⚠️ Lista {url} ne sadrži ispravan M3U format.")
            return {}
    except Exception as e:
        print(f"⛔ Greška pri fetch-u {url}: {e}")
        return {}

# -------------------------
# Normalizuj ime (radi poređenja)
# -------------------------
def normalize(name: str):
    if not name:
        return ""
    s = name.lower()
    for ch_from, ch_to in [
        (" ", ""), ("-", ""), (".", ""), ("_", ""), ("(", ""), (")", ""),
        ("š", "s"), ("č", "c"), ("ć", "c"), ("ž", "z"), ("đ", "dj")
    ]:
        s = s.replace(ch_from, ch_to)
    return s.strip()

# -------------------------
# Glavna logika — izgradi mapu kanala
# -------------------------
def build_channel_map():
    lists = load_lists()
    wanted = load_wanted_channels()
    if not lists:
        print("⚠️ Nema lista u lists.txt")
        return {}

    # 1️⃣ Pronađi prvu radnu listu
    primary_streams = {}
    working_lists = []

    for l in lists:
        parsed = fetch_and_parse(l["url"])
        if parsed:
            primary_streams = parsed
            working_lists.append(l["url"])
            print(f"✅ Prva radna lista: {l['url']}")
            break
        else:
            print(f"⛔ Lista ne radi: {l['url']}")

    # Ako nijedna ne radi
    if not primary_streams:
        print("❌ Nijedna lista nije radna!")
        return {}

    # 2️⃣ Učitaj ostale radne liste (za dopunu)
    for l in lists:
        if l["url"] not in working_lists:
            parsed = fetch_and_parse(l["url"])
            if parsed:
                working_lists.append(l["url"])

    # 3️⃣ Napravi veliku mapu (sve kombinovano)
    combined = {}
    for l_url in working_lists:
        parsed = fetch_and_parse(l_url)
        for name, info in parsed.items():
            n = normalize(name)
            if n not in combined:  # prvi koji se pojavi ostaje
                combined[n] = info

    # 4️⃣ Sastavi finalnu listu po wanted kanalima
    grouped = {}
    for ch in wanted:
        want_name = ch.get("name")
        want_group = ch.get("group", "Ostalo")
        want_logo = ch.get("logo") or DEFAULT_LOGO
        n = normalize(want_name)
        stream = combined.get(n)

        if stream:
            url = stream.get("url")
            status = "ok"
            final_logo = stream.get("logo") or want_logo
        else:
            url = None
            status = "nedostupan"
            final_logo = want_logo

        grouped.setdefault(want_group, []).append({
            "name": want_name,
            "url": url,
            "logo": final_logo,
            "status": status
        })

    return grouped

# -------------------------
# API ruta
# -------------------------
@app.route("/api/channels")
def api_channels():
    grouped = build_channel_map()
    out = [{"group": g, "channels": grouped[g]} for g in grouped]
    return jsonify(out)

# -------------------------
# Static fajlovi
# -------------------------
@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)

# -------------------------
# Start servera
# -------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
