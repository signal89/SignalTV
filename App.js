// App.js
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import WelcomeScreen from "./screens/WelcomeScreen";
import ModeScreen from "./screens/ModeScreen";
import HomeScreen from "./screens/HomeScreen";
import CategoryScreen from "./screens/CategoryScreen";
import GroupScreen from "./screens/GroupScreen";
import PlayerScreen from "./screens/PlayerScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem("signal_seen_mode");
        setInitialRoute(seen ? "Home" : "Welcome");
      } catch (e) {
        setInitialRoute("Welcome");
      }
    })();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerStyle: { backgroundColor: "#000" }, headerTintColor: "#fff", contentStyle: { backgroundColor: "#000" } }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Mode" component={ModeScreen} options={{ title: "Izbor moda" }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "SignalTV" }} />
        <Stack.Screen name="Category" component={CategoryScreen} options={{ title: "Grupe" }} />
        <Stack.Screen name="Group" component={GroupScreen} options={{ title: "Kanali" }} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{ title: "Gledanje", headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
