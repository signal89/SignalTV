import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SERVER_URL } from "../config";

export default function GroupScreen({ route, navigation }) {
  const { category, groupName } = route.params;
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupItems = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/channels`);
        const json = await res.json();
        const arr = (json && json.categories && json.categories[category] && json.categories[category][groupName]) ? json.categories[category][groupName] : [];
        setChannels(arr);
      } catch (err) {
        console.log("Greška:", err);
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupItems();
  }, [category, groupName]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>Učitavanje...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: "#000" }}>
      <Text style={{ color: "white", fontSize: 20, marginBottom: 10 }}>{groupName}</Text>
      {channels.length === 0 ? (
        <Text style={{ color: "white" }}>Nema kanala u ovoj grupi.</Text>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item, idx) => (item.url || item.name) + idx}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.itemBtn} onPress={() => navigation.navigate("Player", { channelList: channels, index })}>
              <Text style={styles.itemText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  itemBtn: { backgroundColor: "#007AFF", padding: 12, marginVertical: 6, borderRadius: 8, alignItems: "center" },
  itemText: { color: "#fff", fontSize: 16 },
});
