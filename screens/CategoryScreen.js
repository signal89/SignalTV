import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SERVER_URL } from "../config";

export default function CategoryScreen({ route, navigation }) {
  const { category } = route.params;
  const [groups, setGroups] = useState([]);
  const [hiddenGroups, setHiddenGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/channels`);
        const json = await res.json();

        const source = json && json.categories ? json.categories : {};
        const catObj = source[category] ? source[category] : {};

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
    if (hiddenGroups.includes(grp))
      newHidden = newHidden.filter((g) => g !== grp);
    else newHidden.push(grp);

    setHiddenGroups(newHidden);
    await AsyncStorage.setItem(
      `hidden_${category}`,
      JSON.stringify(newHidden)
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white", fontSize: 18 }}>Učitavanje...</Text>
      </View>
    );
  }

  if (!groups.length) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white", fontSize: 18 }}>
          Nema dostupnih grupa u ovoj kategoriji.
        </Text>
      </View>
    );
  }

  const visibleGroups = groups.filter(
    (g) =>
      !hiddenGroups.includes(g) &&
      g.toLowerCase().includes(search.toLowerCase())
  );

  const hiddenOnly = groups.filter(
    (g) =>
      hiddenGroups.includes(g) &&
      g.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: "#000" }}>
      <Text
        style={{ color: "white", fontSize: 22, marginBottom: 10 }}
      >
        {category}
      </Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Pretraga grupa..."
        placeholderTextColor="#888"
        style={{
          backgroundColor: "#222",
          color: "#fff",
          padding: 10,
          borderRadius: 8,
          marginBottom: 10,
          fontSize: 16,
        }}
      />

      <FlatList
        data={showHidden ? hiddenOnly : visibleGroups}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupBtn}
            onPress={() =>
              showHidden
                ? toggleGroup(item)
                : navigation.navigate(
                    category === "Serije" ? "Series" : "Group",
                    { category, groupName: item }
                  )
            }
            onLongPress={() => toggleGroup(item)}
          >
            <Text style={styles.groupText}>{item}</Text>
          </TouchableOpacity>
        )}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={5}
        removeClippedSubviews={true}
      />

      <TouchableOpacity
        style={[
          styles.groupBtn,
          { backgroundColor: "#444", marginTop: 10 },
        ]}
        onPress={() => setShowHidden((prev) => !prev)}
      >
        <Text style={styles.groupText}>
          {showHidden
            ? "Prikaži vidljive grupe"
            : "Prikaži sakrivene grupe"}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: "white", marginTop: 10, fontSize: 16 }}>
        Drži grupu za sakriti/ponovo prikazati
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  groupBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  groupText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
