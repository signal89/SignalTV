import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SERVER_URL } from "../config";

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("LiveTV");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/channels`);
        const json = await res.json();

        if (
          json &&
          json.categories &&
          Object.keys(json.categories).length > 0
        ) {
          setCategories(Object.keys(json.categories)); // ["LiveTV","Filmovi","Serije"]
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.log("Greška:", err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() =>
        navigation.navigate("Category", { category: item, tab: activeTab })
      }
    >
      <Text style={styles.gridText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {["LiveTV", "Filmovi", "Serije"].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            style={[styles.tabBtn, activeTab === t && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === t && styles.tabTextActive,
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={{ marginTop: 20 }}
        />
      ) : categories.length > 0 ? (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          numColumns={3}
          contentContainerStyle={{ padding: 10 }}
        />
      ) : (
        <Text
          style={{
            color: "white",
            textAlign: "center",
            marginTop: 20,
          }}
        >
          Nema dostupnih kategorija.
        </Text>
      )}
    </View>
  );
}

const { width } = Dimensions.get("window");
const itemSize = (width - 40) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  tabActive: { backgroundColor: "#007AFF" },
  tabText: { color: "#fff" },
  tabTextActive: { color: "#000", fontWeight: "bold" },
  gridItem: {
    backgroundColor: "#007AFF",
    height: itemSize,
    width: itemSize,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  gridText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
