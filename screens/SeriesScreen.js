// screens/SeriesScreen.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Platform,
  Dimensions,
} from "react-native";
import { SERVER_URL } from "../config";

// Pokušaj više formata i uvijek vrati: show, season, episode
function splitSeriesName(rawName) {
  const name = (rawName || "").trim();
  if (!name) {
    return { show: "", season: null, episode: null };
  }

  let m = name.match(
    /(.*)\s+:\s*Season\s*#\s*(\d+)\s*:\s*Episode\s*#\s*(\d+)/i
  );
  if (m) {
    return {
      show: m[1].trim(),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
    };
  }

  m = name.match(/(.*)\s+S(\d{1,2})\s*E(\d{1,2})/i);
  if (m) {
    return {
      show: m[1].trim(),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
    };
  }

  m = name.match(/(.*)\s+Sezona\s+(\d{1,2})\s+Epizoda\s+(\d{1,2})/i);
  if (m) {
    return {
      show: m[1].trim(),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
    };
  }

  m = name.match(/(.*)\s+Season\s+(\d{1,2})\s+Episode\s+(\d{1,2})/i);
  if (m) {
    return {
      show: m[1].trim(),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
    };
  }

  return { show: name, season: null, episode: null };
}

export default function SeriesScreen({ route, navigation }) {
  const { category, groupName } = route.params;
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [level, setLevel] = useState("shows");
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const { width } = Dimensions.get("window");
  const isTvLike = Platform.isTV || width >= 900;

  useEffect(() => {
    const fetchGroupItems = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/channels`);
        const json = await res.json();

        const source = json && json.categories ? json.categories : {};
        const arr =
          source[category] && source[category][groupName]
            ? source[category][groupName]
            : [];

        setChannels(arr);
      } catch (err) {
        console.log("Greška:", err);
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupItems();
  }, [category, groupName]);

  useEffect(() => {
    setLevel("shows");
    setSelectedShow(null);
    setSelectedSeason(null);
    setSearch("");
    setCurrentIndex(-1);
    setFocusedIndex(0);
  }, [category, groupName]);

  const parsedSeries = useMemo(() => {
    return channels
      .map((ch) => {
        const meta = splitSeriesName(ch.name);
        return { ...ch, ...meta };
      })
      .filter((ch) => ch.show);
  }, [channels]);

  const seriesShows = useMemo(() => {
    const map = new Map();

    for (const ch of parsedSeries) {
      if (!ch.show) continue;
      if (!map.has(ch.show)) map.set(ch.show, ch);
    }

    let list = Array.from(map.values());

    if (search) {
      list = list.filter((it) =>
        (it.show || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    list.sort((a, b) =>
      (a.show || "").localeCompare(b.show || "", "en", {
        sensitivity: "base",
      })
    );

    return list;
  }, [parsedSeries, search]);

  const seriesSeasons = useMemo(() => {
    if (!selectedShow) return [];

    const set = new Set();

    for (const ch of parsedSeries) {
      if (ch.show === selectedShow && ch.season != null) {
        set.add(ch.season);
      }
    }

    let list = Array.from(set);

    if (search) {
      list = list.filter((s) =>
        `Sezona ${s}`.toLowerCase().includes(search.toLowerCase())
      );
    }

    list.sort((a, b) => a - b);
    return list;
  }, [parsedSeries, selectedShow, search]);

  const seriesEpisodes = useMemo(() => {
    if (!selectedShow || selectedSeason == null) return [];

    let list = parsedSeries.filter(
      (ch) => ch.show === selectedShow && ch.season === selectedSeason
    );

    if (search) {
      list = list.filter((ch) =>
        (ch.name || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    list.sort((a, b) => (a.episode || 0) - (b.episode || 0));
    return list;
  }, [parsedSeries, selectedShow, selectedSeason, search]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Učitavanje...</Text>
      </View>
    );
  }

  const title =
    level === "shows"
      ? groupName
      : level === "seasons"
      ? selectedShow
      : `${selectedShow} – Sezona ${selectedSeason}`;

  let dataToRender = [];
  let renderItemFn = null;

  if (level === "shows") {
    dataToRender = seriesShows;

    renderItemFn = ({ item, index }) => {
      const focused = index === focusedIndex;
      const active = index === currentIndex;

      return (
        <TouchableOpacity
          focusable={true}
          activeOpacity={0.85}
          hasTVPreferredFocus={index === 0}
          onFocus={() => setFocusedIndex(index)}
          style={[
            styles.itemBtn,
            active && styles.itemBtnActive,
            focused && styles.itemBtnFocused,
          ]}
          onPress={() => {
            setCurrentIndex(index);
            setSelectedShow(item.show);
            setLevel("seasons");
            setSearch("");
            setFocusedIndex(0);
          }}
        >
          <Text
            style={[styles.itemText, focused && styles.itemTextFocused]}
            numberOfLines={2}
          >
            {item.show}
          </Text>
        </TouchableOpacity>
      );
    };
  } else if (level === "seasons") {
    dataToRender = seriesSeasons;

    renderItemFn = ({ item, index }) => {
      const focused = index === focusedIndex;
      const active = index === currentIndex;

      return (
        <TouchableOpacity
          focusable={true}
          activeOpacity={0.85}
          hasTVPreferredFocus={index === 0}
          onFocus={() => setFocusedIndex(index)}
          style={[
            styles.itemBtn,
            active && styles.itemBtnActive,
            focused && styles.itemBtnFocused,
          ]}
          onPress={() => {
            setCurrentIndex(index);
            setSelectedSeason(item);
            setLevel("episodes");
            setSearch("");
            setFocusedIndex(0);
          }}
        >
          <Text
            style={[styles.itemText, focused && styles.itemTextFocused]}
            numberOfLines={2}
          >
            {`Sezona ${item}`}
          </Text>
        </TouchableOpacity>
      );
    };
  } else {
    dataToRender = seriesEpisodes;

    renderItemFn = ({ item, index }) => {
      const focused = index === focusedIndex;
      const active = index === currentIndex;

      return (
        <TouchableOpacity
          focusable={true}
          activeOpacity={0.85}
          hasTVPreferredFocus={index === 0}
          onFocus={() => setFocusedIndex(index)}
          style={[
            styles.itemBtn,
            active && styles.itemBtnActive,
            focused && styles.itemBtnFocused,
          ]}
          onPress={() => {
            console.log("CLICKED EPISODE:", item.name, item.url);
            setCurrentIndex(index);
            navigation.navigate("Player", {
              channelList: seriesEpisodes,
              index,
            });
          }}
        >
          <Text
            style={[styles.itemText, focused && styles.itemTextFocused]}
            numberOfLines={2}
          >
            {item.name || `Epizoda ${item.episode || ""}`}
          </Text>
        </TouchableOpacity>
      );
    };
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.headerText} numberOfLines={2}>
        {title}
      </Text>

      {!isTvLike && (
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={
            level === "shows"
              ? "Pretraga serija..."
              : level === "seasons"
              ? "Pretraga sezona..."
              : "Pretraga epizoda..."
          }
          placeholderTextColor="#888"
          style={styles.searchInput}
        />
      )}

      {dataToRender.length === 0 ? (
        <Text style={styles.emptyText}>Nema stavki za prikaz.</Text>
      ) : (
        <FlatList
          data={dataToRender}
          keyExtractor={(item, idx) =>
            (item?.url || item?.name || String(item) || "row") + idx
          }
          extraData={{ currentIndex, focusedIndex, level, search }}
          renderItem={renderItemFn}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  },

  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 18,
  },

  headerText: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 10,
    fontWeight: "bold",
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

  emptyText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 10,
  },

  itemBtn: {
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

  itemBtnActive: {
    backgroundColor: "#0D47A1",
  },

  itemBtnFocused: {
    borderColor: "#FFD700",
    borderWidth: 4,
    backgroundColor: "#1565C0",
    transform: [{ scale: 1.05 }],
  },

  itemText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  itemTextFocused: {
    color: "#FFD700",
    fontSize: 19,
  },
});
