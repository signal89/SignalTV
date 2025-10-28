import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { SERVER_URL } from "../config";

export default function GroupScreen({ route, navigation }) {
  const { category, groupName } = route.params;
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/channels`)
      .then((r) => r.json())
      .then((j) => {
        const groupChannels = j.categories?.[category]?.[groupName] || [];
        setChannels(groupChannels);
      })
      .catch((err) => console.log("Greška:", err));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#000", padding: 10 }}>
      <Text style={{ color: "white", fontSize: 20, marginBottom: 10 }}>{groupName}</Text>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.url}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate("Player", { channel: item })}
          >
            <Text style={{ color: "#fff" }}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: "#007AFF",
    padding: 10,
    marginVertical: 5,
    borderRadius: 6,
  },
});
