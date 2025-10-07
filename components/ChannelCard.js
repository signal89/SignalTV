import React from "react";
import { TouchableOpacity, Text, Image } from "react-native";

export default function ChannelCard({ channel, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        backgroundColor: "#eee",
        marginBottom: 10,
        borderRadius: 10,
      }}
    >
      <Image
        source={{ uri: "https://signaltv.onrender.com" + channel.logo }}
        style={{ width: 40, height: 40, marginRight: 10 }}
      />
      <Text style={{ fontSize: 16 }}>{channel.name}</Text>
    </TouchableOpacity>
  );
}
