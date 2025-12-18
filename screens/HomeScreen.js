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

// mapira razne nazive na tri glavne kategorije
const mapCat = (name) => {
  const n = (name || "").toLowerCase();

  // Live TV, IPTV, sl.
  if (n.includes("live") || (n.includes("tv") && !n.includes("series"))) {
    return "LiveTV";
  }

  // Filmovi / Movies / VOD
  if (n.includes("film") || n.includes("movie") || n.includes("vod")) {
    return "Filmovi";
  }

  // Serije / Series
  if (n.includes("serije") || n.includes("series")) {
    return "Serije";
  }

  // sve ostalo ostavi kako jest
  return name;
};

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [rawCategories, setRawCategories] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/channels`);
        const json = await res.json();

        console.log("CHANNELS JSON KEYOVI:", Object.keys(json || {}));
        console.log(
          "CATEGORIES:",
          json && json.categories ? Object.keys(json.categories) : "nema"
        );

        if (json && json.categories && Object.keys(json.categories).length > 0) {
          const source = json.categories;

          const norm = {};
          for (const key of Object.keys(source)) {
            const logical = mapCat(key);
            if (!norm[logical]) norm[logical] = [];
            norm[logical].push(key);
          }

          setRawCategories(norm);
          setCategories(Object.keys(norm)); // npr. ["LIVE-TV","FILMOVI","SERIJE",...]
        } else {
          setCategories([]);
          setRawCategories({});
        }
      } catch (err) {
        console.log("Greška:", err);
        setCategories([]);
        setRawCategories({});
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
        navigation.navigate("Category", {
          category: item,                    // logičko ime
          rawKeys: rawCategories[item] || [], // originalni ključevi iz JSON-a
        })
      }
    >
      <Text style={styles.gridText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
        <Text style={styles.emptyText}>Nema dostupnih kategorija.</Text>
      )}
    </View>
  );
}

const { width } = Dimensions.get("window");
const itemSize = (width - 40) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  emptyText: {
    color: "white",
    textAlign: "center",
    marginTop: 20,
    fontSize: 20,
  },

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
    color: "#222",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 22,
  },
});
