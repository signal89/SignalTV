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
} from "react-native";
import { SERVER_URL } from "../config";

// Pokušaj više formata i uvijek vratiti: show, season, episode
function splitSeriesName(rawName) {
  const name = (rawName || "").trim();
  if (!name) {
    return { show: "", season: null, episode: null };
  }

  // 1) "Ballers (2019) : Season # 3 : Episode # 5"
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

  // 2) "El Chapo S01 E05" ili "El Chapo S1 E5"
  m = name.match(/(.*)\s+S(\d{1,2})\s*E(\d{1,2})/i);
  if (m) {
    return {
      show: m[1].trim(),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
    };
  }

  // 3) "Naziv Sezona 1 Epizoda 5"
  m = name.match(/(.*)\s+Sezona\s+(\d{1,2})\s+Epizoda\s+(\d{1,2})/i);
  if (m) {
    return {
      show: m[1].trim(),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
    };
  }

  // 4) "Naziv Season 1 Episode 5"
  m = name.match(/(.*)\s+Season\s+(\d{1,2})\s+Episode\s+(\d{1,2})/i);
  if (m) {
    return {
      show: m[1].trim(),
      season: parseInt(m[2], 10),
      episode: parseInt(m[3], 10),
    };
  }

  // Ako nijedan format nije pogođen – sve tretiraj kao naziv serije
  return { show: name, season: null, episode: null };
}

export default function SeriesScreen({ route, navigation }) {
  const { category, groupName } = route.params;
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // shows | seasons | episodes
  const [level, setLevel] = useState("shows");
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);

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

  // reset kad promijeniš grupu
  useEffect(() => {
    setLevel("shows");
    setSelectedShow(null);
    setSelectedSeason(null);
    setSearch("");
    setCurrentIndex(-1);
  }, [category, groupName]);

  // kanali + meta info
  const parsedSeries = useMemo(() => {
    return channels
      .map((ch) => {
        const meta = splitSeriesName(ch.name);
        return { ...ch, ...meta };
      })
      .filter((ch) => ch.show);
  }, [channels]);

  // 1) lista serija
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

  // 2) lista sezona za izabranu seriju
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

  // 3) lista epizoda u izabranoj sezoni
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
        <ActivityIndicator size="large" color="#fff" />
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
    renderItemFn = ({ item, index }) => (
      <TouchableOpacity
        style={[
          styles.itemBtn,
          index === currentIndex && styles.itemBtnActive,
        ]}
        onPress={() => {
          setCurrentIndex(index);
          setSelectedShow(item.show);
          setLevel("seasons");
          setSearch("");
        }}
      >
        <Text style={styles.itemText}>{item.show}</Text>
      </TouchableOpacity>
    );
  } else if (level === "seasons") {
    dataToRender = seriesSeasons;
    renderItemFn = ({ item, index }) => (
      <TouchableOpacity
        style={[
          styles.itemBtn,
          index === currentIndex && styles.itemBtnActive,
        ]}
        onPress={() => {
          setCurrentIndex(index);
          setSelectedSeason(item);
          setLevel("episodes");
          setSearch("");
        }}
      >
        <Text style={styles.itemText}>{`Sezona ${item}`}</Text>
      </TouchableOpacity>
    );
  } else {
    dataToRender = seriesEpisodes;
    renderItemFn = ({ item, index }) => (
      <TouchableOpacity
        style={[
          styles.itemBtn,
          index === currentIndex && styles.itemBtnActive,
        ]}
        onPress={() => {
          setCurrentIndex(index);
          navigation.navigate("Player", {
            channelList: seriesEpisodes,
            index,
          });
        }}
      >
        <Text style={styles.itemText}>
          {item.name || `Epizoda ${item.episode || ""}`}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.headerText}>{title}</Text>

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

      {dataToRender.length === 0 ? (
        <Text style={styles.emptyText}>Nema stavki za prikaz.</Text>
      ) : (
        <FlatList
          data={dataToRender}
          keyExtractor={(item, idx) =>
            (item.url || item.name || String(item) || "row") + idx
          }
          renderItem={renderItemFn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 10, backgroundColor: "#000" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: { color: "white", marginTop: 10, fontSize: 18 },

  headerText: {
    color: "white",
    fontSize: 22,
    marginBottom: 10,
  },

  searchInput: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },

  emptyText: { color: "white", fontSize: 18 },

  itemBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  itemBtnActive: {
    backgroundColor: "#555",
    borderColor: "#ffffff",
  },
  itemText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
