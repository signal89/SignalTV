// config.js
// AUTOMATSKI bira backend: lokalni Flask ili Render online

const LOCAL_IP = "http://192.168.0.106:5000"; // <- promijeni ako tvoja IP nije ta
const ONLINE_URL = "https://signaltv.onrender.com";

export const SERVER_URL = __DEV__ ? LOCAL_IP : ONLINE_URL;
// __DEV__ je true kad koristiš Expo Go (lokalno testiranje)
