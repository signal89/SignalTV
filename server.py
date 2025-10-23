from flask import Flask, jsonify
import requests
from concurrent.futures import ThreadPoolExecutor
import time

app = Flask(__name__)

# Cache za brže učitavanje
cache = {"data": None, "timestamp": 0}
CACHE_DURATION = 600  # 10 minuta


def parse_m3u_text(text):
    """Parsiraj M3U tekst u listu kanala"""
    channels = []
    lines = text.splitlines()
    name = logo = group = None

    for line in lines:
        line = line.strip()
        if line.startswith("#EXTINF"):
            name = logo = group = ""
            if 'tvg-logo="' in line:
                try:
                    logo = line.split('tvg-logo="')[1].split('"')[0]
                except:
                    logo = ""
            if 'group-title="' in line:
                try:
                    group = line.split('group-title="')[1].split('"')[0]
                except:
                    group = ""
            if "," in line:
                name = line.split(",")[-1].strip()
        elif line.startswith("http"):
            url = line.strip()
            if name and url:
                channels.append({
                    "name": name,
                    "logo": logo,
                    "group": group,
                    "url": url
                })
    return channels


def fetch_and_parse(url):
    """Preuzmi i parsiraj jednu listu"""
    try:
        clean_url = url.split("username=")[0] + "username=" + url.split("username=")[1].split("&")[0] + "&password=" + url.split("password=")[1].split("&")[0] + "&type=m3u_plus"
        print(f"[fetch] {clean_url}")
    except:
        clean_url = url

    try:
        r = requests.get(clean_url, timeout=15)
        if r.status_code == 200 and "#EXTM3U" in r.text:
            parsed = parse_m3u_text(r.text)
            print(f"[OK lista] {clean_url} -> {len(parsed)} kanala")
            return parsed
        else:
            print(f"[FAIL lista] {clean_url} status {r.status_code}")
    except Exception as e:
        print(f"[Greška lista] {clean_url} -> {e}")
    return []


def load_all_lists():
    """Učitaj sve liste iz fajla lists.txt"""
    try:
        with open("lists.txt", "r", encoding="utf-8") as f:
            lines = [x.strip() for x in f.readlines() if "|" in x]
    except FileNotFoundError:
        print("[Greška] Fajl lists.txt nije pronađen.")
        return []

    urls = [x.split("|")[1].strip() for x in lines if x.strip()]
    all_channels = []

    print(f"[INFO] Učitavam {len(urls)} lista...")
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(fetch_and_parse, urls))

    for result in results:
        if result:
            all_channels.extend(result)

    print(f"[INFO] Ukupno učitano {len(all_channels)} kanala.")
    return all_channels


@app.route("/api/channels", methods=["GET"])
def get_channels():
    """API endpoint koji vraća sve kanale"""
    global cache
    now = time.time()

    if cache["data"] and (now - cache["timestamp"] < CACHE_DURATION):
        return jsonify(cache["data"])

    all_channels = load_all_lists()

    grouped = {}
    for ch in all_channels:
        group = ch.get("group", "Ostalo") or "Ostalo"
        grouped.setdefault(group, []).append({
            "name": ch["name"],
            "logo": ch["logo"],
            "url": ch["url"],
            "status": "ok"
        })

    data = {"channels": grouped}
    cache = {"data": data, "timestamp": now}
    return jsonify(data)


@app.route("/")
def home():
    return "<h3>✅ SignalTV Server radi!</h3><p>Idi na <a href='/api/channels'>/api/channels</a> da vidiš kanale.</p>"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
