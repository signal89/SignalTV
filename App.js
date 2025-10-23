import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  BackHandler,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { WebView } from "react-native-webview";

const Stack = createStackNavigator();

// 🔗 Tvoj server
const SERVER_URL = "https://signaltv.onrender.com/api/channels";

// 🟢 Ekran dobrodošlice (unos koda)
function WelcomeScreen({ navigation }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleEnter = () => {
    if (code === "Signal2112") {
      navigation.replace("Mode");
    } else {
      setError("❌ Pogrešan kod!");
    }
  };

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Dobrodošli u SignalTV</Text>
      <TextInput
        style={styles.input}
        placeholder="Unesi pristupni kod"
        value={code}
        onChangeText={setCode}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Ulaz" onPress={handleEnter} />
    </View>
  );
}

// 🟣 Ekran za izbor moda
function ModeScreen({ navigation }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Odaberi način rada</Text>
      <Button title="📱 Telefon" onPress={() => navigation.replace("Home")} />
      <View style={{ height: 20 }} />
      <Button title="📺 TV / Box" onPress={() => navigation.replace("Home")} />
    </View>
  );
}

// 🟡 Početni ekran (učitava kanale)
function HomeScreen({ navigation }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(SERVER_URL)
      .then((res) => res.json())
      .then((data) => {
        setChannels(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = channels.filter((ch) =>
    ch.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Učitavanje kanala...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <TextInput
        style={styles.input}
        placeholder="Pretraga kanala..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.channelButton}
            onPress={() => navigation.navigate("Player", { url: item.url, name: item.name })}
          >
            <Text style={styles.channelText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// 🔵 Player ekran
function PlayerScreen({ route }) {
  const { url, name } = route.params;
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.playerTitle}>{name}</Text>
      <WebView source={{ uri: url }} allowsFullscreenVideo />
    </View>
  );
}

export default function App() {
  useEffect(() => {
    // Fix za BackHandler warning
    return () => {
      if (BackHandler.remove) BackHandler.remove();
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Mode" component={ModeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// 🎨 Stilovi
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    width: "80%",
    borderRadius: 8,
    textAlign: "center",
  },
  error: { color: "red", marginBottom: 10 },
  channelButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  channelText: { color: "white", fontSize: 16, fontWeight: "bold" },
  playerTitle: {
    textAlign: "center",
    padding: 10,
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
  },
});
