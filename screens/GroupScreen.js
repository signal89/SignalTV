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
  Platform,
  Dimensions,
} from "react-native";
import { SERVER_URL } from "../config";

export default function GroupScreen({ route, navigation }) {
  const { category, groupName } = route.params;
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const { width } = Dimensions.get("window");
  const isTvLike = Platform.isTV || width >= 900;

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Učitavanje...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.headerText} numberOfLines={2}>
        {groupName}
      </Text>

      {!isTvLike && (
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Pretraga kanala..."
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
      )}

      {filteredChannels.length === 0 ? (
        <Text style={styles.emptyText}>Nema kanala u ovoj grupi.</Text>
      ) : (
        <FlatList
          data={filteredChannels}
          keyExtractor={(item, idx) => (item.url || item.name || "chan") + idx}
          extraData={{ currentIndex, focusedIndex }}
          renderItem={({ item, index }) => {
            const focused = index === focusedIndex;
            const active = index === currentIndex;

            return (
              <TouchableOpacity
                focusable={true}
                activeOpacity={0.85}
                hasTVPreferredFocus={index === 0}
                onFocus={() => setFocusedIndex(index)}
                onPress={() => handlePress(index)}
                style={[
                  styles.itemBtn,
                  active && styles.itemBtnActive,
                  focused && styles.itemBtnFocused,
                ]}
              >
                <Text
                  style={[
                    styles.itemText,
                    focused && styles.itemTextFocused,
                  ]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={5}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 10,
    backgroundColor: "#000",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },

  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 18,
  },

  headerText: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "bold",
  },

  searchInput: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
  },

  listContent: {
    paddingBottom: 20,
  },

  emptyText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 10,
  },

  itemBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 60,
  },

  itemBtnActive: {
    backgroundColor: "#0D47A1",
  },

  itemBtnFocused: {
    borderColor: "#FFD700",
    borderWidth: 4,
    backgroundColor: "#1565C0",
    transform: [{ scale: 1.04 }],
  },

  itemText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  itemTextFocused: {
    color: "#FFD700",
    fontSize: 19,
  },
});
