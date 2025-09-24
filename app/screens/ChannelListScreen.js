import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import PlayerScreen from "./PlayerScreen";

const API_URL = "http://localhost:5000/kanali"; // promijeni kad deployaš na Render

export default function ChannelListScreen() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setChannels(data);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator size="large" />;

  if (selected) {
    return <PlayerScreen channel={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <FlatList
      data={channels}
      numColumns={3}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={{ flex:1/3, margin:5, alignItems:"center" }}
          onPress={() => setSelected(item)}
        >
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={{ width:100, height:100 }} />
          ) : (
            <View style={{ width:100, height:100, backgroundColor:"#ccc" }} />
          )}
          <Text style={{ textAlign:"center", marginTop:5 }}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  );
}
