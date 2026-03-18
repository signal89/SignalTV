import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ModeScreen from "./screens/ModeScreen";
import HomeScreen from "./screens/HomeScreen";
import CategoryScreen from "./screens/CategoryScreen";
import GroupScreen from "./screens/GroupScreen";
import PlayerScreen from "./screens/PlayerScreen";
import SeriesScreen from "./screens/SeriesScreen";

const Stack = createNativeStackNavigator();

function StartupLoader() {
  const [signalStep, setSignalStep] = useState(0);
  const glowAnim = useRef(new Animated.Value(0)).current;

  const signalLetters = useMemo(
    () => ["🇸", "🇮", "🇬", "🇳", "🇦", "🇱"],
    []
  );

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setSignalStep((prev) => (prev + 1) % (signalLetters.length + 1));
    }, 250);

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    ).start();

    return () => {
      clearInterval(stepTimer);
      glowAnim.stopAnimation();
    };
  }, [glowAnim, signalLetters.length]);

  const animatedOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
      }}
    >
      <Text
        style={{
          color: "#FFD700",
          fontSize: 30,
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: 26,
        }}
      >
        👉🇸 🇮 🇬 🇳 🇦 🇱 👈
      </Text>

      <Animated.View
        style={{
          backgroundColor: "#111",
          borderWidth: 2,
          borderColor: "#FFD700",
          borderRadius: 18,
          paddingVertical: 16,
          paddingHorizontal: 18,
          marginBottom: 18,
          opacity: animatedOpacity,
        }}
      >
        <View style={{ flexDirection: "row" }}>
          {signalLetters.map((letter, index) => {
            const active = index < signalStep;
            return (
              <Text
                key={index}
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  marginHorizontal: 4,
                  color: active ? "#FFD700" : "#555",
                }}
              >
                {letter}
              </Text>
            );
          })}
        </View>
      </Animated.View>

      <Text style={{ color: "#fff", fontSize: 18 }}>
        Pokretanje aplikacije...
      </Text>
    </View>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const loadInitialRoute = async () => {
      try {
        const seen = await AsyncStorage.getItem("signal_seen_mode");
        console.log("APP START signal_seen_mode =", seen);
        setInitialRoute(seen === "1" ? "Home" : "Mode");
      } catch (e) {
        console.log("APP INIT ERROR:", e);
        setInitialRoute("Mode");
      }
    };

    loadInitialRoute();
  }, []);

  if (!initialRoute) {
    return <StartupLoader />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: "bold",
          },
          contentStyle: { backgroundColor: "#000" },
        }}
      >
        <Stack.Screen
          name="Mode"
          component={ModeScreen}
          options={{ title: "Izbor moda" }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "👉 SIGNAL 👈" }}
        />
        <Stack.Screen
          name="Category"
          component={CategoryScreen}
          options={{ title: "Grupe" }}
        />
        <Stack.Screen
          name="Group"
          component={GroupScreen}
          options={{ title: "Kanali" }}
        />
        <Stack.Screen
          name="Series"
          component={SeriesScreen}
          options={{ title: "Serije" }}
        />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
