import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";

export default function ChannelList({ navigation }) {
  const [kanali, setKanali] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ automatsko prepoznavanje TV-a ili mobitela
  const isTV = Platform.isTV || Platform.OS === "android" && !Platform.isPad && !Platform.isTVDevice;

  useEffect(() => {
    fetch("https://signaltv.onrender.com/api/channels")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setKanali(data);
        } else {
          console.error("Neispravan odgovor API-ja:", data);
          setKanali([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Greška pri učitavanju kanala:", err);
        setLoading(false);
      });
  }, []);

  const getLogo = (name = "") => {
    const lower = name.toLowerCase();
    if (lower.includes("arena")) return require("../static/arenasport.png");
    if (lower.includes("sport klub") || lower.includes("sportklub") || lower.includes("sk "))
      return require("../static/sportklub.png");
    return require("../static/default.png");
  };

  const renderItem = ({ item }) => {
    const name = item?.name || "Nepoznat kanal";
    const url = item?.url || null;

    return (
      <TouchableOpacity
        style={[styles.item, isTV && styles.itemTV]}
        onPress={() =>
          url
            ? navigation.navigate("Player", { kanal: { name, url } })
            : alert("Greška: URL nije pronađen")
        }
      >
        <Image source={getLogo(name)} style={styles.logo} />
        <Text style={styles.name}>{name}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ffcc" />
        <Text style={{ color: "white", marginTop: 10 }}>Učitavanje kanala...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📺 Lista kanala</Text>
      <FlatList
        data={kanali}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        numColumns={isTV ? 1 : 2}
        key={isTV ? "tv" : "phone"}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  grid: {
    paddingHorizontal: 10,
  },
  item: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    margin: 6,
    borderRadius: 10,
    padding: 10,
  },
  itemTV: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 5,
    borderRadius: 10,
  },
  name: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
});
