// config.js
// Ako želiš lokalno testiranje preko Flask-a na računaru (npr. 192.168.177.160:5000),
// postavi LOCAL_IP na tu adresu. Inače koristi ONLINE_URL (Render).
const LOCAL_IP = "http://192.168.177.160:5000";
const ONLINE_URL = "https://signaltv.onrender.com";

// Kad razvijaš lokalno u Expo Go na telefonu, __DEV__ obično bude true.
// Ako želiš forsirati online, zamijeni __DEV__ sa false.
export const SERVER_URL = __DEV__ ? LOCAL_IP : ONLINE_URL;
