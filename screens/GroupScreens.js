import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Dimensions, Image, StyleSheet } from "react-native";
import { SERVER_URL } from "../config";

export default function GroupScreen({ route, navigation }) {
  const { groupName } = route.params;
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    fetch(SERVER_URL)
      .then(r => r.json())
      .then(j => {
        for (const cat in j.categories) {
          if (j.categories[cat][groupName]) {
            setChannels(j.categories[cat][groupName]);
            break;
          }
        }
      });
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("Player", { kanal: item, lista: channels })}
    >
      {item.logo && <Image source={{ uri: item.logo }} style={styles.logo} />}
      <Text style={styles.text}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={channels}
      renderItem={renderItem}
      keyExtractor={(item, idx) => item.name + idx}
      numColumns={3} // grid 3 kocke po redu
      contentContainerStyle={{ padding: 10 }}
    />
  );
}

const { width } = Dimensions.get("window");
const itemSize = (width - 40) / 3;

const styles = StyleSheet.create({
  item: {
    backgroundColor: "#007AFF",
    width: itemSize,
    height: itemSize + 30,
    margin: 5,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  logo: { width: "100%", height: itemSize - 30, resizeMode: "cover", borderRadius: 8 },
  text: { color: "#fff", textAlign: "center", marginTop: 5 },
});
