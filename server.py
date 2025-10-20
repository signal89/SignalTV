# server.py
from flask import Flask, jsonify, send_from_directory
import requests, json, re, os, time

app = Flask(__name__)

LISTS_FILE = "lists.txt"        # tvoje liste (redoslijed važan)
CHANNELS_FILE = "channels.json" # željeni kanali (name, logo, group)
STATIC_DIR = "static"

# -------------------------
# UTIL: učitaj lists.txt (jedna lista po liniji ili "Naziv | URL")
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
# UTIL: učitaj channels.json (lista željenih kanala)
# -------------------------
def load_wanted_channels():
    if not os.path.exists(CHANNELS_FILE):
        print("⚠️ Nema channels.json fajla!")
        return []
    with open(CHANNELS_FILE, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
            return data
        except Exception as e:
            print("❌ Greška pri učitavanju channels.json:", e)
            return []

# -------------------------
# PARSIRANJE M3U: vrati dict ime-> {url, group, logo}
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
            # name
            m_name = re.search(r',(.+)$', line)
            current_name = m_name.group(1).strip() if m_name else None
            # group-title
            m_group = re.search(r'group-title="([^"]+)"', line, flags=re.IGNORECASE)
            current_group = m_group.group(1).strip() if m_group else "Ostalo"
            # tvg-logo
            m_logo = re.search(r'tvg-logo="([^"]+)"', line, flags=re.IGNORECASE)
            current_logo = m_logo.group(1).strip() if m_logo else None
        elif line.startswith("http") or line.startswith("rtmp") or line.startswith("udp://"):
            if current_name:
                streams[current_name] = {
                    "url": line,
                    "group": current_group,
                    "logo": current_logo
                }
            current_name = None
            current_group = "Ostalo"
            current_logo = None
    return streams

# -------------------------
# Pokušaj dohvatiti i parsirati M3U sa URL-a (timeout, safefail)
# -------------------------
def fetch_and_parse(url, timeout=8):
    try:
        r = requests.get(url, timeout=timeout)
        if r.status_code == 200 and "#EXTM3U" in r.text:
            return parse_m3u_text(r.text)
        else:
            return {}
    except Exception as e:
        # ne prekidamo — vraćamo prazno
        print(f"⚠️ Greška pri fetch-u {url}: {e}")
        return {}

# -------------------------
# NORMALIZACIJA IMENA (za matching)
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
# LOGIKA: Pronađi prvu radnu listu, uzmi sve kanale iz nje.
# Za kanale koje nedostaju, skeniraj ostale radne liste redom i uzmi prvi link koji nađe.
# -------------------------
def build_channel_map():
    lists = load_lists()
    wanted = load_wanted_channels()

    if not lists:
        print("⚠️ Nema lista u lists.txt")
        return {}

    # 1) Potraži prvu radnu listu i parsiraj je (primary)
    primary_streams = {}
    working_lists = []  # spremamo URL-ove koji rade (da ih koristimo kasnije)
    primary_index = None

    for idx, l in enumerate(lists):
        print(f"Provjeravam listu (kandidata) {l['url']}")
        parsed = fetch_and_parse(l["url"])
        if parsed:
            print(f"✅ Prva radna lista: {l['url']} (kanala: {len(parsed)})")
            primary_streams = parsed
            working_lists.append(l["url"])
            primary_index = idx
            break
        else:
            print(f"⛔ Lista nije radila: {l['url']}")

    # Ako nismo našli ni jednu radnu listu u prvom prolazu,
    # pokušaj prikupiti barem sve koje rade (fallback) ali vratiti prazan map ako ništa ne radi
    if primary_index is None:
        # probaj sve i prikupi one koje rade
        for l in lists:
            parsed = fetch_and_parse(l["url"])
            if parsed:
                working_lists.append(l["url"])
        if not working_lists:
            print("❌ Nijedna lista ne radi.")
            return {}
        # uzmi prvu od working_lists kao primarnu (i parse je)
        primary_streams = fetch_and_parse(working_lists[0])
        primary_index = next((i for i, x in enumerate(lists) if x["url"] == working_lists[0]), 0)
        print(f"⚠️ Nije pronađena prvobitna prva radna lista, koristim {working_lists[0]} kao primarnu.")

    # 2) Sastavi mapu naziv_normalized -> info (iz primarne liste prvo)
    normalized_map = {}
    for name, info in primary_streams.items():
        normalized_map[normalize(name)] = {
            "orig_name": name,
            "url": info.get("url"),
            "group": info.get("group", "Ostalo"),
            "logo": info.get("logo")
        }

    # 3) Ako neki wanted kanal nije u normalized_map, skeniraj ostale liste (u redoslijedu)
    # da mu nadješ prvi radni link
    for l in lists:
        if l["url"] == lists[primary_index]["url"]:
            continue  # preskoči primarnu (već obrađena)
        parsed = fetch_and_parse(l["url"])
        if not parsed:
            continue
        # za svaki item iz parsed: ako već postoji u normalized_map, ne diraj (first wins),
        # ali mi ciljamo samo wanted kanale: stoga ćemo kasnije mapirati wanted na normalized_map
        for name, info in parsed.items():
            n = normalize(name)
            if n not in normalized_map:
                normalized_map[n] = {
                    "orig_name": name,
                    "url": info.get("url"),
                    "group": info.get("group", "Ostalo"),
                    "logo": info.get("logo")
                }

    # 4) Sada mapiraj wanted kanale (iz channels.json) na prvi nađeni url
    grouped = {}
    for ch in wanted:
        want_name = ch.get("name")
        want_group = ch.get("group", "Ostalo")
        want_logo = ch.get("logo", "/static/default.png")
        n = normalize(want_name)
        stream = normalized_map.get(n)
        if stream:
            url = stream.get("url")
            status = "ok" if url else "nedostupan"
            # ako grupa iz channels.json želiš koristiti kao prioritet, koristi je; inače možeš uzeti stream['group']
            final_group = want_group or stream.get("group", "Ostalo")
            final_logo = want_logo if want_logo else stream.get("logo", "/static/default.png")
        else:
            url = None
            status = "nedostupan"
            final_group = want_group
            final_logo = want_logo

        item = {
            "name": want_name,
            "url": url,
            "logo": final_logo,
            "status": status
        }
        grouped.setdefault(final_group, []).append(item)

    return grouped

# -------------------------
# ROUTE: vraća grupisan JSON
# -------------------------
@app.route("/api/channels")
def api_channels():
    grouped = build_channel_map()
    # konvertuj u listu objekata {group, channels} (lakše za frontend)
    out = [{"group": g, "channels": grouped[g]} for g in grouped]
    return jsonify(out)

# -------------------------
# SERVIRANJE STATIC fajlova (logoi, itd.)
# -------------------------
@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(STATIC_DIR, filename)

# -------------------------
# START
# -------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
