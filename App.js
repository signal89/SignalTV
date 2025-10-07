import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, BackHandler } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./screens/HomeScreen";
import ChannelList from "./screens/ChannelList";
import PlayerScreen from "./screens/PlayerScreen";

const Stack = createStackNavigator();
const SERVER_URL = "https://signaltv.onrender.com/api/channels"; // <- tvoj Render link

function WelcomeScreen({ navigation }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleEnter = () => {
    if (code === "Signal2112") {
      navigation.replace("Mode");
    } else {
      setError("Pogrešan kod!");
    }
  };

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Dobrodošli u SignalTV</Text>
      <TextInput
        style={styles.input}
        placeholder="Unesi kod"
        value={code}
        onChangeText={setCode}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Ulaz" onPress={handleEnter} />
    </View>
  );
}

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

export default function App() {
  useEffect(() => {
    // ✅ Fix za BackHandler.removeEventListener warning
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
        <Stack.Screen name="Lista kanala" component={ChannelList} />
        <Stack.Screen name="Player" component={PlayerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    width: "80%",
    borderRadius: 5,
    textAlign: "center",
  },
  error: { color: "red", marginBottom: 10 },
});
