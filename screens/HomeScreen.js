import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from "react-native";
import { SERVER_URL } from "../config";

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/channels`);
        const json = await res.json();
        if (json && json.categories && typeof json.categories === "object") {
          setCategories(Object.keys(json.categories));
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.log("Greška:", err);
        alert("Greška pri učitavanju kategorija");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => navigation.navigate("Category", { category: item })}
    >
      <Text style={styles.gridText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={{ color: "white" }}>Učitavanje...</Text>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          numColumns={3}
          contentContainerStyle={{ padding: 10 }}
        />
      )}
    </View>
  );
}

const { width } = Dimensions.get("window");
const itemSize = (width - 40) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  gridItem: {
    backgroundColor: "#007AFF",
    height: itemSize,
    width: itemSize,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  gridText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});
