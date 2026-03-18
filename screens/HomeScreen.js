import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
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
  const [signalStep, setSignalStep] = useState(0);

  const glowAnim = useRef(new Animated.Value(0)).current;

  const signalLetters = useMemo(() => ["🇸", "🇮", "🇬", "🇳", "🇦", "🇱"], []);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setSignalStep((prev) => (prev + 1) % (signalLetters.length + 1));
    }, 250);

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    ).start();

    return () => {
      clearInterval(stepTimer);
      glowAnim.stopAnimation();
    };
  }, [glowAnim, signalLetters.length]);

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
  const numColumns = categories.length <= 3 ? 3 : isTvLike ? 4 : 3;
  const horizontalPadding = 20;
  const totalMargins = numColumns * 10;
  const itemSize = (width - horizontalPadding - totalMargins) / numColumns;

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

  const animatedShadow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.9],
  });

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderWrap}>
          <Text style={styles.mainTitle}>👉🇸 🇮 🇬 🇳 🇦 🇱 👈</Text>

          <Animated.View
            style={[
              styles.signalBox,
              {
                shadowOpacity: animatedShadow,
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.75, 1],
                }),
              },
            ]}
          >
            <View style={styles.lettersRow}>
              {signalLetters.map((letter, index) => {
                const active = index < signalStep;
                return (
                  <Text
                    key={index}
                    style={[
                      styles.signalLetter,
                      active ? styles.signalLetterActive : styles.signalLetterIdle,
                    ]}
                  >
                    {letter}
                  </Text>
                );
              })}
            </View>
          </Animated.View>

          <Text style={styles.loadingText}>Učitavanje kategorija...</Text>
        </View>
      ) : categories.length > 0 ? (
        <View style={styles.homeContent}>
          <Text style={styles.screenTitle}>Odaberi kategoriju</Text>

          <FlatList
            data={categories}
            renderItem={renderItem}
            keyExtractor={(item) => item}
            numColumns={numColumns}
            extraData={focusedIndex}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={
              numColumns > 1 ? styles.columnWrapperCentered : undefined
            }
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>
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

  homeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  screenTitle: {
    color: "#FFD700",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 28,
  },

  listContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  columnWrapperCentered: {
    justifyContent: "center",
  },

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  mainTitle: {
    color: "#FFD700",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 26,
  },

  signalBox: {
    backgroundColor: "#111",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 18,
    shadowColor: "#FFD700",
    shadowRadius: 16,
    elevation: 10,
  },

  lettersRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  signalLetter: {
    fontSize: 28,
    fontWeight: "bold",
    marginHorizontal: 4,
  },

  signalLetterIdle: {
    color: "#555",
  },

  signalLetterActive: {
    color: "#FFD700",
  },

  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 18,
    textAlign: "center",
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
