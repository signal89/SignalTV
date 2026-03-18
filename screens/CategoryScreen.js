import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SERVER_URL } from "../config";

export default function CategoryScreen({ route, navigation }) {
  const { category, rawKeys = [] } = route.params;

  const [groups, setGroups] = useState([]);
  const [hiddenGroups, setHiddenGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const { width } = Dimensions.get("window");
  const isTvLike = Platform.isTV || width >= 900;

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/channels`);
        const json = await res.json();

        const source = json && json.categories ? json.categories : {};
        const catObj = {};
        const keysToUse = rawKeys.length ? rawKeys : [category];

        keysToUse.forEach((key) => {
          if (source[key]) {
            Object.assign(catObj, source[key]);
          }
        });

        setGroups(Object.keys(catObj));

        const h = await AsyncStorage.getItem(`hidden_${category}`);
        if (h) {
          setHiddenGroups(JSON.parse(h));
        } else {
          setHiddenGroups([]);
        }
      } catch (err) {
        console.log("Greška:", err);
        setGroups([]);
        setHiddenGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [category, rawKeys]);

  const toggleGroup = async (grp) => {
    try {
      let newHidden = [...hiddenGroups];

      if (hiddenGroups.includes(grp)) {
        newHidden = newHidden.filter((g) => g !== grp);
      } else {
        newHidden.push(grp);
      }

      setHiddenGroups(newHidden);
      await AsyncStorage.setItem(
        `hidden_${category}`,
        JSON.stringify(newHidden)
      );
    } catch (err) {
      console.log("Greška pri sakrivanju grupe:", err);
    }
  };

  const visibleGroups = useMemo(() => {
    return groups.filter(
      (g) =>
        !hiddenGroups.includes(g) &&
        g.toLowerCase().includes(search.toLowerCase())
    );
  }, [groups, hiddenGroups, search]);

  const hiddenOnly = useMemo(() => {
    return groups.filter(
      (g) =>
        hiddenGroups.includes(g) &&
        g.toLowerCase().includes(search.toLowerCase())
    );
  }, [groups, hiddenGroups, search]);

  const listData = showHidden ? hiddenOnly : visibleGroups;

  useEffect(() => {
    setFocusedIndex(0);
  }, [search, showHidden, groups.length, hiddenGroups.length]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Učitavanje...</Text>
      </View>
    );
  }

  if (!groups.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>
          Nema dostupnih grupa u ovoj kategoriji.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.headerText}>{category}</Text>

      {!isTvLike && (
        <TextInput
          style={styles.searchInput}
          placeholder="Pretraži grupe..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
      )}

      {listData.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            {showHidden
              ? "Nema sakrivenih grupa za prikaz."
              : "Nema grupa za prikaz."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item}
          extraData={{ focusedIndex, showHidden, hiddenGroups }}
          renderItem={({ item, index }) => {
            const focused = index === focusedIndex;

            return (
              <TouchableOpacity
                focusable={true}
                hasTVPreferredFocus={index === 0}
                onFocus={() => setFocusedIndex(index)}
                style={[
                  styles.groupBtn,
                  focused && styles.groupBtnFocused,
                ]}
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
                <Text
                  style={[
                    styles.groupText,
                    focused && styles.groupTextFocused,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={5}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        focusable={true}
        onPress={() => setShowHidden((prev) => !prev)}
        style={[styles.groupBtn, styles.toggleBtn]}
      >
        <Text style={[styles.groupText, styles.toggleText]}>
          {showHidden
            ? "Prikaži vidljive grupe"
            : "Prikaži sakrivene grupe"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hintText}>
        Drži grupu za sakriti ili ponovo prikazati
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 10,
    backgroundColor: "#000",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 20,
  },

  loadingText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 10,
    textAlign: "center",
  },

  headerText: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "bold",
    textAlign: "center",
  },

  searchInput: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
  },

  listContent: {
    paddingBottom: 20,
  },

  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyText: {
    color: "#bbb",
    fontSize: 18,
    textAlign: "center",
  },

  groupBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 58,
  },

  groupBtnFocused: {
    borderColor: "#FFD700",
    borderWidth: 4,
    backgroundColor: "#1565C0",
    transform: [{ scale: 1.05 }],
  },

  groupText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  groupTextFocused: {
    color: "#FFD700",
    fontSize: 19,
  },

  toggleBtn: {
    backgroundColor: "#444",
    marginTop: 10,
  },

  toggleText: {
    color: "#fff",
  },

  hintText: {
    color: "#bbb",
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
});
