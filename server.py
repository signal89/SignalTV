# server.py


# Parsiraj primary
primary_streams = parse_m3u_text(primary_text) if primary_text else {}


# Kombinuj i dopuni iz ostalih radnih listi (ali prvi radni ostaje prioritet)
combined = {}
for name, info in primary_streams.items():
lk = name.strip()
combined[lk] = {"url": info.get("url"), "group": info.get("group", "Ostalo"), "logo": info.get("logo")}


# dopuni iz ostalih radnih listi
for s in statuses:
if s["status"] != "ok":
continue
if s["url"] == primary_url:
continue
ok, txt = fetch_url(s["url"])
if not ok:
continue
parsed = parse_m3u_text(txt)
for name, info in parsed.items():
if name not in combined:
combined[name] = {"url": info.get("url"), "group": info.get("group", "Ostalo"), "logo": info.get("logo")}


# Sada grupiši u kategorije: LiveTV, Filmovi, Serije na osnovu group-title heuristike
categories = {"LiveTV": {}, "Filmovi": {}, "Serije": {}}


for name, info in combined.items():
cat = categorize_by_group_name(info.get("group", "Ostalo"))
group_name = info.get("group") or "Ostalo"
categories.setdefault(cat, {})
categories[cat].setdefault(group_name, []).append({
"name": name,
"url": info.get("url"),
"logo": info.get("logo")
})


return {"status_lists": statuses, "categories": categories}




# --- endpoints ---
@app.route('/api/channels')
def api_channels():
global cache
now = time.time()
if cache['data'] and now - cache['timestamp'] < CACHE_DURATION:
return jsonify(cache['data'])


lists = load_lists()
out = build_channels_structure(lists)


cache = {"data": out, "timestamp": now}
return jsonify(out)




@app.route('/')
def home():
return "<h3>SignalTV API radi ✅</h3><p>Idi na <a href='/api/channels'>/api/channels</a></p>"




if __name__ == '__main__':
port = int(os.environ.get('PORT', 5000))
app.run(host='0.0.0.0', port=port, debug=True)