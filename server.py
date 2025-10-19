from flask import Flask, jsonify, send_from_directory
import requests, json, re, os

app = Flask(__name__)

LISTS_FILE = "lists.txt"
CHANNELS_FILE = "channels.json"
STATIC_DIR = "static"

# ---------------------------
# 🔹 UČITAVANJE LISTA
# ---------------------------
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


# ---------------------------
# 🔹 UČITAVANJE KANALA
# ---------------------------
def load_channels():
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


# ---------------------------
# 🔹 PARSIRANJE M3U
# ---------------------------
def parse_m3u(m3u_text):
    channels = {}
    name, group, logo = None, "Ostalo", ""
    for line in m3u_text.splitlines():
        if line.startswith("#EXTINF"):
            # Izvuci naziv kanala
            m_name = re.search(r",(.+)$", line)
            if m_name:
                name = m_name.group(1).strip()
            # Izvuci logo
            m_logo = re.search(r'tvg-logo="([^"]+)"', line)
            if m_logo:
                logo = m_logo.group(1)
            # Izvuci grupu
            m_group = re.search(r'group-title="([^"]+)"', line)
            if m_group:
                group = m_group.group(1)
        elif line.startswith("http"):
            if name:
                channels[name] = {"url": line.strip(), "group": group, "logo": logo}
                name, group, logo = None, "Ostalo", ""
    return channels


# ---------------------------
# 🔹 NORMALIZACIJA IMENA
# ---------------------------
def normalize(name):
    return (
        name.lower()
        .replace(" ", "")
        .replace("-", "")
        .replace(".", "")
        .replace("_", "")
        .replace("(", "")
        .replace(")", "")
        .replace("š", "s")
        .replace("č", "c")
        .replace("ć", "c")
        .replace("ž", "z")
        .replace("đ", "dj")
        .strip()
    )


# ---------------------------
# 🔹 API: /api/channels
# ---------------------------
@app.route("/api/channels")
def api_channels():
    lists = load_lists()
    wanted_channels = load_channels()
    working_channels = []
    stream_map = {}

    # 🔁 Traži prvu radnu listu
    for l in lists:
        try:
            print(f"🔍 Provjeravam listu: {l['url']}")
            r = requests.get(l["url"], timeout=6)
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

    normalized_streams = {normalize(k): v for k, v in stream_map.items()}
    grouped = {}

    for ch in wanted_channels:
        name = ch["name"]
        group = ch.get("group", "Ostalo")
        logo = ch.get("logo", "/static/default.png")
        norm_name = normalize(name)
        stream = normalized_streams.get(norm_name)

        status = "ok" if stream else "nedostupan"
        url = stream["url"] if stream else None

        new_channel = {
            "name": name,
            "logo": logo if logo else (stream["logo"] if stream else "/static/default.png"),
            "url": url,
            "status": status
        }

        if group not in grouped:
            grouped[group] = []
        grouped[group].append(new_channel)

    # ✅ Konvertuj u listu za JSON
    grouped_list = [{"group": g, "channels": grouped[g]} for g in grouped]

    print(f"📡 Ukupno grupa: {len(grouped_list)}")
    total_ok = sum(1 for g in grouped_list for c in g["channels"] if c["status"] == "ok")
    print(f"✅ Pronađeno {total_ok} radnih kanala.")
    return jsonify(grouped_list)


# ---------------------------
# 🔹 STATICKE SLIKE
# ---------------------------
@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)


# ---------------------------
# 🔹 START SERVERA
# ---------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
