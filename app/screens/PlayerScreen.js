import React from "react";
import { View, Button } from "react-native";
import { Video } from "expo-av";

export default function PlayerScreen({ channel, onBack }) {
  return (
    <View style={{ flex:1, backgroundColor:"black" }}>
      <Video
        source={{ uri: channel.url }}
        style={{ flex:1 }}
        useNativeControls
        resizeMode="contain"
        shouldPlay
      />
      <Button title="Nazad" onPress={onBack} />
    </View>
  );
}
