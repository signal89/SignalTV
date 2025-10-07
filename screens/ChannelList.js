import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

export default function ChannelList({ navigation }) {
  const [kanali, setKanali] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://signaltv.onrender.com/api/channels")
      .then((res) => res.json())
      .then((data) => {
        setKanali(Array.isArray(data) ? data : []);
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
    if (lower.includes("sportklub") || lower.includes("sk "))
      return require("../static/sportklub.png");
    return require("../static/default.png");
  };

  const renderItem = ({ item }) => {
    const naziv = item?.naziv || "Nepoznat kanal";
    const url = item?.url || null;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() =>
          url
            ? navigation.navigate("Player", { kanal: { naziv, url } })
            : alert("Greška: URL nije pronađen")
        }
      >
        <Image source={getLogo(naziv)} style={styles.logo} />
        <Text style={styles.name}>{naziv}</Text>
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
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    marginVertical: 6,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 10,
  },
  logo: { width: 50, height: 50, marginRight: 10, borderRadius: 8 },
  name: { color: "white", fontSize: 16 },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
});
