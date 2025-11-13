import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SERVER_URL } from "../config";

export default function CategoryScreen({ route, navigation }) {
  const { category } = route.params;
  const [groups, setGroups] = useState([]);
  const [hiddenGroups, setHiddenGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/channels`);
        const json = await res.json();
        const catObj = (json && json.categories && json.categories[category]) ? json.categories[category] : {};
        setGroups(Object.keys(catObj));
        const h = await AsyncStorage.getItem(`hidden_${category}`);
        if (h) setHiddenGroups(JSON.parse(h));
      } catch (err) {
        console.log("Greška:", err);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, [category]);

  const toggleGroup = async (grp) => {
    let newHidden = [...hiddenGroups];
    if (hiddenGroups.includes(grp)) newHidden = newHidden.filter((g) => g !== grp);
    else newHidden.push(grp);
    setHiddenGroups(newHidden);
    await AsyncStorage.setItem(`hidden_${category}`, JSON.stringify(newHidden));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>Učitavanje...</Text>
      </View>
    );
  }

  if (!groups.length) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>Nema dostupnih grupa u ovoj kategoriji.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: "#000" }}>
      <Text style={{ color: "white", fontSize: 20, marginBottom: 10 }}>{category}</Text>
      <FlatList
        data={groups}
        keyExtractor={(item) => item}
        renderItem={({ item }) =>
          !hiddenGroups.includes(item) && (
            <TouchableOpacity style={styles.groupBtn} onPress={() => navigation.navigate("Group", { category, groupName: item })} onLongPress={() => toggleGroup(item)}>
              <Text style={{ color: "#fff" }}>{item}</Text>
            </TouchableOpacity>
          )
        }
      />
      <Text style={{ color: "white", marginTop: 10 }}>Drži grupu za sakriti/ponovo prikazati</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  groupBtn: { backgroundColor: "#007AFF", padding: 12, marginVertical: 6, borderRadius: 8, alignItems: "center" },
});
