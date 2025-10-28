import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "./screens/WelcomeScreen";
import ModeScreen from "./screens/ModeScreen";
import HomeScreen from "./screens/HomeScreen";
import CategoryScreen from "./screens/CategoryScreen";
import GroupScreen from "./screens/GroupScreen";
import PlayerScreen from "./screens/PlayerScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#000" }, headerTintColor: "#fff" }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ title: "SignalTV" }} />
        <Stack.Screen name="Mode" component={ModeScreen} options={{ title: "Izbor moda" }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Kategorije" }} />
        <Stack.Screen name="Category" component={CategoryScreen} options={{ title: "Grupe" }} />
        <Stack.Screen name="Group" component={GroupScreen} options={{ title: "Kanali" }} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{ title: "Gledanje" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
