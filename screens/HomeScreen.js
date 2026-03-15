// screens/HomeScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SERVER_URL } from "../config";

// mapira razne nazive na tri glavne kategorije
const mapCat = (name) => {
  const n = (name || "").toLowerCase();

  if (n.includes("live") || (n.includes("tv") && !n.includes("series"))) {
    return "LiveTV";
  }

  if (n.includes("film") || n.includes("movie") || n.includes("vod")) {
    return "Filmovi";
  }

  if (n.includes("serije") || n.includes("series")) {
    return "Serije";
  }

  return name;
};

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [rawCategories, setRawCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState(0);

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
          setCategories(Object.keys(norm));
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

  const { width } = Dimensions.get("window");
  const isTvLike = Platform.isTV || width >= 900;
  const numColumns = isTvLike ? 4 : 3;
  const itemSize = (width - 20 - numColumns * 10) / numColumns;

  const renderItem = ({ item, index }) => {
    const focused = index === focusedIndex;

    return (
      <TouchableOpacity
        focusable={true}
        activeOpacity={0.85}
        hasTVPreferredFocus={index === 0}
        onFocus={() => setFocusedIndex(index)}
        style={[
          styles.gridItem,
          { height: itemSize, width: itemSize },
          focused && styles.gridItemFocused,
        ]}
        onPress={() =>
          navigation.navigate("Category", {
            category: item,
            rawKeys: rawCategories[item] || [],
          })
        }
      >
        <Text style={[styles.gridText, focused && styles.gridTextFocused]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Učitavanje kategorija...</Text>
        </View>
      ) : categories.length > 0 ? (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          numColumns={numColumns}
          extraData={focusedIndex}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.emptyText}>Nema dostupnih kategorija.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  listContent: {
    padding: 10,
  },

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 18,
  },

  emptyText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
    fontSize: 18,
  },

  gridItem: {
    backgroundColor: "#007AFF",
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    paddingHorizontal: 8,
  },

  gridItemFocused: {
    borderColor: "#FFD700",
    borderWidth: 4,
    backgroundColor: "#1565C0",
    transform: [{ scale: 1.08 }],
  },

  gridText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 20,
  },

  gridTextFocused: {
    color: "#FFD700",
    fontSize: 22,
  },
});
