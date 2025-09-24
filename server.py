# server.py
from flask import Flask, jsonify, send_from_directory, session, redirect, url_for, request, abort
import json, requests, re, os, logging
from functools import lru_cache

# ---- basic app setup ----
app = Flask(__name__, static_folder="static", static_url_path="/static")
app.secret_key = "signalTV_secret_key_change_if_you_like_please"  # change if needed

# ---- CONFIG - edit if you want ----
INSTALL_CODE = "Signal2112"
CHANNELS_FILE = "channels.json"
LISTS_FILE = "lists.txt"
LIST_FETCH_TIMEOUT = 6  # seconds per request
CACHE_MAXSIZE = 128
# -------------------------

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
print("SignalTV server start. Open http://127.0.0.1:5000/ in your browser.")

# ---------- helpers ----------
def load_channels():
    if not os.path.exists(CHANNELS_FILE):
        logging.warning(f"{CHANNELS_FILE} not found - returning empty channels list.")
        return []
    with open(CHANNELS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_lists():
    lists = []
    if not os.path.exists(LISTS_FILE):
        logging.warning(f"{LISTS_FILE} not found - no lists loaded.")
        return lists
    with open(LISTS_FILE, "r", encoding="utf-8") as f:
        for ln in f:
            ln = ln.strip()
            if not ln:
                continue
            # accept "Name | url" or "Name|url" or just url
            if " | " in ln:
                name, url = ln.split(" | ", 1)
            elif "|" in ln:
                name, url = ln.split("|", 1)
            else:
                name, url = ("Lista", ln)
            lists.append({"name": name.strip(), "url": url.strip()})
    return lists


# normalize channel names for matching: lowercase, remove resolution tags, country tags, punctuation
_normalize_re = re.compile(r"\b(bh|bih|bosna|hr|hrt|cro|hrv|hrvatska|sr|ser|rs|serbia|sd|hd|fhd|uhd|4k)\b", flags=re.I)
_strip_punct_re = re.compile(r"[^\w\s\d]+")


def normalize_name(s: str) -> str:
    if not s:
        return ""
    s = s.lower()
    s = _normalize_re.sub(" ", s)
    s = _strip_punct_re.sub(" ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def detect_country_from_text(s: str) -> str:
    s_low = (s or "").lower()
    if any(x in s_low for x in ("bih", "bh", "bht", "bosna")):
        return "BiH"
    if any(x in s_low for x in ("hr", "hrt", "hrv", "cro", "hrvatska", "novatv")):
        return "HR"
    if any(x in s_low for x in ("sr", "ser", "rs", "rts", "prva", "pink")):
        return "SR"
    return "Ostalo"


# caching fetched list content for the lifetime of the process
@lru_cache(maxsize=CACHE_MAXSIZE)
def fetch_list_text_cached(url: str):
    if not url:
        return None
    try:
        logging.info(f"Fetching list: {url}")
        r = requests.get(url, timeout=LIST_FETCH_TIMEOUT)
        r.raise_for_status()
        return r.text
    except Exception as e:
        logging.warning(f"Failed to fetch {url}: {e}")
        return None


def fetch_all_lists_text(lists):
    texts = {}
    for li in lists:
        url = li["url"]
        texts[url] = fetch_list_text_cached(url)
    return texts


# core mapping logic
def build_channel_map(channels_list, lists_conf):
    channel_entries = []
    for ch in channels_list:
        name = ch.get("name", "").strip()
        norm = normalize_name(name)
        is_arena = "arena sport" in norm or "arena" in norm
        is_sportklub = "sport klub" in norm or "sportklub" in norm
        channel_entries.append({
            "orig": ch,
            "name": name,
            "norm": norm,
            "is_arena": is_arena,
            "is_sportklub": is_sportklub
        })

    lists_texts = fetch_all_lists_text(lists_conf)
    results = []

    for ch_ent in channel_entries:
        found = False
        found_url = None
        found_country = None
        # search every list until found
        for li in lists_conf:
            text = lists_texts.get(li["url"])
            if not text:
                logging.debug(f"List {li['name']} not available for matching.")
                continue
            lines = text.splitlines()
            for i, line in enumerate(lines):
                if not line or not line.startswith("#EXTINF"):
                    continue
                try:
                    mlname = line.split(",", 1)[1].strip()
                except Exception:
                    mlname = line
                norm_ml = normalize_name(mlname)

                # arena/sportklub fuzzy matching (handle numbered variants)
                if ch_ent["is_arena"] or ch_ent["is_sportklub"]:
                    # match if normalized master appears in list name OR any part of master appears in list name
                    if ch_ent["norm"] in norm_ml or any(part in norm_ml for part in ch_ent["norm"].split()):
                        if i + 1 < len(lines):
                            candidate_url = lines[i + 1].strip()
                            if candidate_url:
                                found = True
                                found_url = candidate_url
                                found_country = detect_country_from_text(mlname)
                                break
                else:
                    # exact normalized equality or substring match (both directions)
                    if ch_ent["norm"] == norm_ml or ch_ent["norm"] in norm_ml or norm_ml in ch_ent["norm"]:
                        if i + 1 < len(lines):
                            candidate_url = lines[i + 1].strip()
                            if candidate_url:
                                found = True
                                found_url = candidate_url
                                found_country = detect_country_from_text(mlname)
                                break
            if found:
                logging.debug(f"Matched '{ch_ent['name']}' in list '{li['name']}'")
                break

        ch_obj = ch_ent["orig"].copy()
        ch_obj.setdefault("logo", ch_obj.get("logo", "/static/default.png"))
        ch_obj.setdefault("group", ch_obj.get("group", "Ostalo"))
        ch_obj["url"] = found_url if found else None
        ch_obj["country"] = found_country if found_country else detect_country_from_text(ch_ent["name"])
        results.append(ch_obj)

    return results


# ---------- ROUTES ----------
# root - device choice + code
@app.route("/", methods=["GET", "POST"])
def root():
    # if already authorized, go welcome
    if session.get("authorized"):
        return redirect(url_for("welcome"))

    msg = ""
    if request.method == "POST":
        code = request.form.get("code", "")
        device = request.form.get("device", "")
        if code == INSTALL_CODE:
            session["authorized"] = True
            session["device"] = device or "phone"
            return redirect(url_for("welcome"))
        msg = "Pogrešan kod. Pokušaj ponovo."

    return f"""
    <div style="font-family:Arial; text-align:center; margin-top:60px;">
      <h1>🔒 SignalTV - Aktivacija</h1>
      <p>Odaberi uređaj i unesi aktivacijski kod.</p>
      <form method="post">
        <label style="margin-right:12px"><input type="radio" name="device" value="phone" checked> Telefon</label>
        <label style="margin-right:12px"><input type="radio" name="device" value="tv"> TV / Box</label>
        <br><br>
        <input name="code" placeholder="Unesi kod (npr. Signal2112)" style="padding:10px; font-size:16px; width:260px;">
        <button type="submit" style="padding:10px 20px; margin-left:8px;">Potvrdi</button>
      </form>
      <p style="color:red;">{msg}</p>
      <p style="max-width:600px; margin:20px auto; color:#666;">
        Aktivacijski kod omogućava da aplikaciju koriste samo tvoji ljudi. Kod je <strong>{INSTALL_CODE}</strong>.
      </p>
    </div>
    """


@app.route("/welcome")
def welcome():
    if not session.get("authorized"):
        return redirect(url_for("root"))
    device = session.get("device", "phone")
    device_text = "TV / Box" if device == "tv" else "Telefon"
    return f"""
    <div style="font-family:Arial; text-align:center; margin-top:60px;">
      <h1>📺 Dobrodošli u SignalTV</h1>
      <p style="max-width:700px; margin:20px auto;">
        Odabrali ste: <strong>{device_text}</strong>.<br><br>
        SignalTV učitava tvoje M3U liste redom i prikazuje samo one kanale koje si definisao u <code>channels.json</code>.
        Ako prva lista ne radi, pokušat će se sljedeća, sve dok se ne nađe radna lista.
      </p>
      <a href="/kanali" style="display:inline-block; padding:12px 24px; background:#27AE60; color:white; border-radius:6px; text-decoration:none;">Nastavi</a>
    </div>
    """


# API: list of lists and their availability (quick status)
@app.route("/api/lists")
def api_lists():
    lists = load_lists()
    stats = []
    for idx, li in enumerate(lists, start=1):
        txt = fetch_list_text_cached(li["url"])
        available = bool(txt)
        stats.append({
            "id": idx,
            "name": li["name"],
            "url": li["url"],
            "available": available
        })
    return jsonify(stats)


# API: all channels mapped to found stream URLs (or null)
@app.route("/api/channels")
def api_channels():
    channels_list = load_channels()
    lists_conf = load_lists()
    mapped = build_channel_map(channels_list, lists_conf)
    return jsonify(mapped)


# API: per-country endpoints
@app.route("/api/channels/bih")
def api_channels_bih():
    allc = api_channels().get_json()
    return jsonify([c for c in allc if c.get("country") == "BiH"])


@app.route("/api/channels/hr")
def api_channels_hr():
    allc = api_channels().get_json()
    return jsonify([c for c in allc if c.get("country") == "HR"])


@app.route("/api/channels/sr")
def api_channels_sr():
    allc = api_channels().get_json()
    return jsonify([c for c in allc if c.get("country") == "SR"])


# API: debug - map specifically using single list id (1-based)
@app.route("/api/list/<int:list_id>")
def api_list_specific(list_id):
    lists_conf = load_lists()
    if list_id < 1 or list_id > len(lists_conf):
        return jsonify({"error": "Invalid list id", "available": len(lists_conf)}), 400
    sel = lists_conf[list_id - 1]
    txt = fetch_list_text_cached(sel["url"])
    if not txt:
        return jsonify({"error": f"List {list_id} not available"}), 200
    # produce mapping only from that list
    channels_list = load_channels()
    matched = []
    lines = txt.splitlines()
    for ch in channels_list:
        name_norm = normalize_name(ch.get("name", ""))
        for i, line in enumerate(lines):
            if not line.startswith("#EXTINF"):
                continue
            try:
                mlname = line.split(",", 1)[1].strip()
            except:
                mlname = line
            norm_ml = normalize_name(mlname)
            if name_norm == norm_ml or name_norm in norm_ml or norm_ml in name_norm or ("arena sport" in name_norm and "arena" in norm_ml) or ("sport klub" in name_norm and "sport" in norm_ml):
                url = lines[i + 1].strip() if i + 1 < len(lines) else None
                chc = ch.copy()
                chc["url"] = url
                chc["country"] = detect_country_from_text(mlname)
                matched.append(chc)
                break
    return jsonify(matched)


# FRONTEND: channels page with grouping and simple player + overlay quick menu
@app.route("/kanali")
def page_kanali():
    return """
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>SignalTV - Kanali</title>
<style>
  body{font-family:Arial; background:#f4f6f8; margin:0; padding:20px;}
  header{display:flex; align-items:center; justify-content:space-between}
  h1{color:#2E86C1}
  .group{margin-top:24px}
  .kanal{background:#fff;padding:12px;border-radius:8px;margin:10px 0;display:flex;align-items:center;box-shadow:0 2px 6px rgba(0,0,0,0.08)}
  .kanal img{width:64px;height:64px;object-fit:contain;margin-right:12px}
  .kanal .info{flex:1}
  .btn{padding:8px 12px;background:#27AE60;color:#fff;border-radius:6px;text-decoration:none}
  .disabled{padding:8px 12px;background:#ccc;color:#333;border-radius:6px}
  #playerWrap{position:fixed; right:20px; top:80px; width:420px; background:#111; color:#fff; padding:10px; border-radius:8px; display:block}
  video{width:400px;height:230px;background:#000}
  #overlay{position:fixed; left:20px; top:80px; width:520px; height:640px; overflow:auto; background:rgba(255,255,255,0.98); border-radius:8px; padding:10px; display:none}
  .closeOverlay{display:inline-block;margin-bottom:8px;background:#e74c3c;color:#fff;padding:6px 10px;border-radius:6px;text-decoration:none}
</style>
</head>
<body>
<header>
  <h1>📺 SignalTV - Kanali</h1>
  <div>
    <a href="/api/channels" target="_blank">API JSON</a> |
    <a href="/api/lists" target="_blank">Lists status</a>
  </div>
</header>

<div id="groups"></div>

<div id="playerWrap">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <strong id="playerTitle">Nema pokrenutog kanala</strong>
    <a href="#" id="openList" class="btn">Meni</a>
  </div>
  <div style="margin-top:8px">
    <video id="player" controls autoplay></video>
  </div>
  <div id="playerInfo" style="margin-top:8px;color:#ddd;font-size:13px"></div>
</div>

<div id="overlay">
  <a href="#" id="closeOverlay" class="closeOverlay">Zatvori</a>
  <div id="overlayList"></div>
</div>

<script>
async function loadChannels(){
  const res = await fetch('/api/channels');
  const data = await res.json();
  // group data by country key
  const groups = {"BiH":[], "HR":[], "SR":[], "Ostalo":[]};
  data.forEach(ch => {
    const country = ch.country || "Ostalo";
    if(!groups[country]) groups[country] = [];
    groups[country].push(ch);
  });

  const container = document.getElementById('groups');
  container.innerHTML = '';
  for(const key of Object.keys(groups)){
    const arr = groups[key];
    const section = document.createElement('div');
    section.className = 'group';
    section.innerHTML = `<h2>${key} (${arr.length})</h2>`;
    arr.forEach(ch => {
      const el = document.createElement('div');
      el.className = 'kanal';
      const logo = ch.logo || '/static/default.png';
      const playBtn = ch.url ? `<a class="btn" href="#" data-url="${ch.url}" data-name="${ch.name}">▶️ Gledaj</a>` : `<span class="disabled">Nema dostupno</span>`;
      el.innerHTML = `<img src="${logo}" onerror="this.src='/static/default.png'"><div class="info"><strong>${ch.name}</strong><div style="color:#666;font-size:13px">${ch.group || ''}</div></div>${playBtn}`;
      section.appendChild(el);
    });
    container.appendChild(section);
  }

  // hook play buttons
  document.querySelectorAll('.btn[data-url]').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const url = btn.getAttribute('data-url');
      const name = btn.getAttribute('data-name');
      startStream(url, name);
    });
  });

  // overlay open
  document.getElementById('openList').addEventListener('click', (e)=>{
    e.preventDefault();
    document.getElementById('overlay').style.display = 'block';
    buildOverlay(data);
  });
  document.getElementById('closeOverlay').addEventListener('click', (e)=>{
    e.preventDefault();
    document.getElementById('overlay').style.display = 'none';
  });
}

function buildOverlay(allChannels){
  const list = document.getElementById('overlayList');
  list.innerHTML = '';
  allChannels.forEach(ch=>{
    const row = document.createElement('div');
    row.style.padding='8px'; row.style.borderBottom='1px solid #eee'; row.style.display='flex'; row.style.justifyContent='space-between';
    const left = document.createElement('div'); left.innerHTML = `<strong>${ch.name}</strong><br><small style="color:#666">${ch.group || ''}</small>`;
    const right = document.createElement('div');
    if(ch.url){
      const a = document.createElement('a'); a.href='#'; a.className='btn'; a.innerText='▶️ Gledaj'; a.addEventListener('click',(e)=>{ e.preventDefault(); startStream(ch.url, ch.name); document.getElementById('overlay').style.display='none'; });
      right.appendChild(a);
    } else {
      const s = document.createElement('span'); s.className='disabled'; s.innerText='Nema dostupno'; right.appendChild(s);
    }
    row.appendChild(left); row.appendChild(right); list.appendChild(row);
  });
}

function startStream(url, title){
  const player = document.getElementById('player');
  const playerTitle = document.getElementById('playerTitle');
  playerTitle.innerText = title;
  player.src = url;
  player.play().catch(()=>{ alert('Player could not start - browser may block this format. Use Android app for full streaming.'); });
  document.getElementById('playerInfo').innerText = 'Stream: ' + url;
}

// initial load
loadChannels();
</script>

</body>
</html>
"""


# static files route - will serve logos or default if present in ./static
@app.route("/static/<path:fn>")
def static_files(fn):
    return send_from_directory(app.static_folder, fn)


# admin: clear cache / re-fetch
@app.route("/admin/refresh", methods=["POST"])
def admin_refresh():
    # clearing cache - simple and useful during development
    fetch_list_text_cached.cache_clear()
    return jsonify({"ok": True, "msg": "Cache cleared, next requests will re-fetch lists."})


# run
if __name__ == "__main__":
    # ensure static default image exists
    try:
        if not os.path.exists(app.static_folder):
            os.makedirs(app.static_folder, exist_ok=True)
        default_path = os.path.join(app.static_folder, "default.png")
        if not os.path.exists(default_path):
            with open(default_path, "wb") as f:
                # 1x1 transparent PNG binary
                f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
                        b'\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4'
                        b'\x89\x00\x00\x00\nIDATx\xdac`\x00\x00\x00\x02\x00'
                        b'\x01\xe2!\xbc\x33\x00\x00\x00\x00IEND\xaeB`\x82')
    except Exception:
        pass

    app.run(host="0.0.0.0", port=5000, debug=True)
