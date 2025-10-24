import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SERVER_URL } from "../config";

export default function CategoryScreen({ route, navigation }) {
  const { category } = route.params;
  const [groups, setGroups] = useState([]);
  const [hiddenGroups, setHiddenGroups] = useState([]);

  useEffect(() => {
    fetch(SERVER_URL)
      .then(r => r.json())
      .then(j => {
        const catGroups = Object.keys(j.categories[category] || {});
        setGroups(catGroups);
        AsyncStorage.getItem(`hidden_${category}`).then(h => {
          if (h) setHiddenGroups(JSON.parse(h));
        });
      });
  }, []);

  const toggleGroup = grp => {
    let newHidden = [...hiddenGroups];
    if (hiddenGroups.includes(grp)) newHidden = newHidden.filter(g => g !== grp);
    else newHidden.push(grp);
    setHiddenGroups(newHidden);
    AsyncStorage.setItem(`hidden_${category}`, JSON.stringify(newHidden));
  };

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: "#000" }}>
      <Text style={{ color: "white", fontSize: 20, marginBottom: 10 }}>{category}</Text>
      <FlatList
        data={groups}
        keyExtractor={item => item}
        renderItem={({ item }) =>
          !hiddenGroups.includes(item) && (
            <TouchableOpacity
              style={styles.groupBtn}
              onPress={() => navigation.navigate("Group", { groupName: item })}
              onLongPress={() => toggleGroup(item)}
            >
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
  groupBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
});
