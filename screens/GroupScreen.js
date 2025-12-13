import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SERVER_URL } from "../config";

export default function GroupScreen({ route, navigation }) {
  const { category, groupName } = route.params;
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchGroupItems = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/channels`);
        const json = await res.json();

        const source = json && json.categories ? json.categories : {};

        const arr =
          source[category] && source[category][groupName]
            ? source[category][groupName]
            : [];
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
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "white", marginTop: 10 }}>
          Učitavanje...
        </Text>
      </View>
    );
  }

  const filteredChannels = channels.filter((ch) =>
    (ch.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: "#000" }}>
      <Text
        style={{ color: "white", fontSize: 20, marginBottom: 10 }}
      >
        {groupName}
      </Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Pretraga kanala..."
        placeholderTextColor="#888"
        style={{
          backgroundColor: "#222",
          color: "#fff",
          padding: 8,
          borderRadius: 8,
          marginBottom: 10,
        }}
      />

      {filteredChannels.length === 0 ? (
        <Text style={{ color: "white" }}>
          Nema kanala u ovoj grupi.
        </Text>
      ) : (
        <FlatList
          data={filteredChannels}
          keyExtractor={(item, idx) =>
            (item.url || item.name || "chan") + idx
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.itemBtn}
              onPress={() =>
                navigation.navigate("Player", {
                  channelList: filteredChannels,
                  index,
                })
              }
            >
              <Text style={styles.itemText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  itemBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  itemText: { color: "#fff", fontSize: 16 },
});
