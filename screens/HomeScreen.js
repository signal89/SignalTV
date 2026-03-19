import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from "react-native";
import { SERVER_URL } from "../config";

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

  const colorAnim = useRef(new Animated.Value(0)).current;

  const orderedCategories = useMemo(() => {
    const order = ["Filmovi", "LiveTV", "Serije"];
    return order.filter((item) => categories.includes(item));
  }, [categories]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [colorAnim]);

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
          setRawCategories({});
          setCategories([]);
        }
      } catch (err) {
        console.log("Greška:", err);
        setRawCategories({});
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const animatedColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#666666", "#FFD700"],
  });

  const isTvLike = Platform.isTV;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>SIGNAL TV</Text>
      </View>

      <View style={styles.centerWrap}>
        {loading ? (
          <View style={styles.loaderWrap}>
            <Animated.Text
              style={[styles.centerSignalText, { color: animatedColor }]}
            >
              SIGNAL TV
            </Animated.Text>

            <Text style={styles.loadingText}>Učitavanje...</Text>
          </View>
        ) : orderedCategories.length > 0 ? (
          <View
            style={[
              styles.categoriesWrap,
              isTvLike ? styles.categoriesWrapRow : styles.categoriesWrapColumn,
            ]}
          >
            {orderedCategories.map((item, index) => {
              const focused = index === focusedIndex;

              return (
                <TouchableOpacity
                  key={item}
                  focusable={true}
                  hasTVPreferredFocus={index === 0}
                  onFocus={() => setFocusedIndex(index)}
                  onPress={() =>
                    navigation.navigate("Category", {
                      category: item,
                      rawKeys: rawCategories[item] || [],
                    })
                  }
                  style={[
                    styles.categoryBtn,
                    focused && styles.categoryBtnFocused,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      focused && styles.categoryTextFocused,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>Nema dostupnih kategorija.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  topBar: {
    paddingTop: 18,
    paddingBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  topTitle: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },

  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  loaderWrap: {
    justifyContent: "center",
    alignItems: "center",
  },

  centerSignalText: {
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 14,
  },

  loadingText: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
  },

  emptyText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 20,
  },

  categoriesWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  categoriesWrapRow: {
    flexDirection: "row",
  },

  categoriesWrapColumn: {
    flexDirection: "column",
  },

  categoryBtn: {
    backgroundColor: "#007AFF",
    width: 190,
    height: 110,
    marginHorizontal: 10,
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  categoryBtnFocused: {
    borderColor: "#FFD700",
    borderWidth: 4,
    backgroundColor: "#1565C0",
    transform: [{ scale: 1.06 }],
  },

  categoryText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },

  categoryTextFocused: {
    color: "#FFD700",
  },
});
