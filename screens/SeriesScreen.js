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

// Parsiranje imena epizode serije
function splitSeriesName(rawName) {
  const parts = (rawName || "").split(" : ");
  if (parts.length < 3) {
    return { show: rawName, season: null, episode: null };
  }
  const show = parts[0]; // "Tajkun", "Juzni Vetar (2020)"...

  const seasonPart = parts[1]; // "Season # 1"
  const episodePart = parts[2]; // "Episode # 3 (....)"

  const seasonMatch = seasonPart.match(/Season\s*#\s*(\d+)/i);
  const episodeMatch = episodePart.match(/Episode\s*#\s*(\d+)/i);

  return {
    show,
    season: seasonMatch ? Number(seasonMatch[1]) : null,
    episode: episodeMatch ? Number(episodeMatch[1]) : null,
  };
}

export default function SeriesScreen({ route, navigation }) {
  const { category, groupName } = route.params;
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [level, setLevel] = useState("shows"); // "shows" | "seasons" | "episodes"
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);

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

  // reset na promjeni grupe
  useEffect(() => {
    setLevel("shows");
    setSelectedShow(null);
    setSelectedSeason(null);
    setSearch("");
  }, [category, groupName]);

  const parsedSeries = useMemo(() => {
    return channels
      .map((ch) => {
        const meta = splitSeriesName(ch.name);
        return { ...ch, ...meta };
      })
      .filter((ch) => ch.show); // samo oni s imenom
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
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "white", marginTop: 10 }}>
          Učitavanje...
        </Text>
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
    renderItemFn = ({ item }) => (
      <TouchableOpacity
        style={styles.itemBtn}
        onPress={() => {
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
    renderItemFn = ({ item }) => (
      <TouchableOpacity
        style={styles.itemBtn}
        onPress={() => {
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
        style={styles.itemBtn}
        onPress={() =>
          navigation.navigate("Player", {
            channelList: seriesEpisodes,
            index,
          })
        }
      >
        <Text style={styles.itemText}>
          {item.name || `Epizoda ${item.episode || ""}`}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: "#000" }}>
      <Text
        style={{ color: "white", fontSize: 20, marginBottom: 10 }}
      >
        {title}
      </Text>

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
        style={{
          backgroundColor: "#222",
          color: "#fff",
          padding: 8,
          borderRadius: 8,
          marginBottom: 10,
        }}
      />

      {dataToRender.length === 0 ? (
        <Text style={{ color: "white" }}>
          Nema stavki za prikaz.
        </Text>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  itemBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  itemText: { color: "#fff", fontSize: 18 },
});
