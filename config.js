// config.js

// Lokalni Flask server (kad razvijaš i testiraš preko Expo Go)
const LOCAL_IP = "http://192.168.0.103:5000";

// Online server na Renderu – koristi se u APK-u i kad je app u production modu
const ONLINE_URL = "https://signaltv.onrender.com";

// U dev modu (__DEV__ === true) koristi lokalni server,
// u production modu (APK, EAS build) koristi Render URL.
export const SERVER_URL = __DEV__ ? LOCAL_IP : ONLINE_URL;
