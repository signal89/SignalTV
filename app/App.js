import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import WelcomeScreen from "./screens/WelcomeScreen";
import ChannelListScreen from "./screens/ChannelListScreen";

export default function App() {
  const [firstTime, setFirstTime] = useState(true);

  if (firstTime) {
    return <WelcomeScreen onClose={() => setFirstTime(false)} />;
  }

  return <ChannelListScreen />;
}

