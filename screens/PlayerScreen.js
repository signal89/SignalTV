import React from "react";
import { View, Text } from "react-native";
import { Video } from "expo-av";

export default function PlayerScreen({ route }) {
  const { channel } = route.params;

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <Video
        source={{ uri: channel.url }}
        style={{ flex: 1 }}
        useNativeControls
        resizeMode="contain"
      />
      <Text style={{ color: "white", textAlign: "center", padding: 10 }}>{channel.name}</Text>
    </View>
  );
}
