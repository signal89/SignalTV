import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from "react-native";
import { SERVER_URL } from "../config"; // definiraj SERVER_URL u config.js ili direktno ovdje

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(SERVER_URL)
      .then(res => res.json())
      .then(json => {
        setCategories(Object.keys(json.categories || {}));
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        alert("Greška prilikom učitavanja kategorija");
      });
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
      {loading ? <Text style={{ color: "white" }}>Učitavanje...</Text> :
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={item => item}
          numColumns={3} // 3 kocke po redu
          contentContainerStyle={{ padding: 10 }}
        />}
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
