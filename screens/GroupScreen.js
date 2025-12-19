// screens/GroupScreen.js
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
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [focusedIndex, setFocusedIndex] = useState(0);

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
        <Text style={styles.loadingText}>Učitavanje...</Text>
      </View>
    );
  }

  const filteredChannels = channels.filter((ch) =>
    (ch.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handlePress = (index) => {
    const ch = filteredChannels[index];
    console.log("CLICKED CHANNEL:", ch?.name, ch?.url);
    setCurrentIndex(index);
    navigation.navigate("Player", {
      channelList: filteredChannels,
      index,
    });
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.headerText}>{groupName}</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Pretraga kanala..."
        placeholderTextColor="#888"
        style={styles.searchInput}
      />

      {filteredChannels.length === 0 ? (
        <Text style={styles.emptyText}>Nema kanala u ovoj grupi.</Text>
      ) : (
        <FlatList
          data={filteredChannels}
          keyExtractor={(item, idx) =>
            (item.url || item.name || "chan") + idx
          }
          extraData={{ currentIndex, focusedIndex }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              focusable={true}
              onFocus={() => setFocusedIndex(index)}
              style={[
                styles.itemBtn,
                index === currentIndex && styles.itemBtnActive,
                index === focusedIndex && styles.itemBtnFocused,
              ]}
              onPress={() => handlePress(index)}
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
  screen: { flex: 1, padding: 10, backgroundColor: "#000" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: { color: "white", marginTop: 10, fontSize: 18 },

  headerText: {
    color: "white",
    fontSize: 22,
    marginBottom: 10,
  },

  searchInput: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },

  emptyText: { color: "white", fontSize: 18 },

  itemBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  itemBtnActive: {
    backgroundColor: "#555",
  },
  itemBtnFocused: {
    borderColor: "#ffffff",
  },
  itemText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
