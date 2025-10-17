import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";

export default function ChannelList({ navigation }) {
  const [kanali, setKanali] = useState([]);
  const [grupe, setGrupe] = useState([]);
  const [odabranaGrupa, setOdabranaGrupa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isTV =
    Platform.isTV ||
    (Platform.OS === "android" && !Platform.isPad && !Platform.isTVDevice);

  const ucitajKanale = () => {
    setLoading(true);
    fetch("https://signaltv.onrender.com/api/channels")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setKanali(data);
          const groups = [...new Set(data.map((k) => k.group || "Ostalo"))];
          setGrupe(groups.sort());
          setError(false);
        } else {
          setKanali([]);
          setError(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Greška pri učitavanju kanala:", err);
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    ucitajKanale();
  }, []);

  const getLogo = (name = "") => {
    const lower = name.toLowerCase();
    if (lower.includes("arena")) return require("../static/arenasport.png");
    if (lower.includes("sport klub") || lower.includes("sportklub") || lower.includes("sk "))
      return require("../static/sportklub.png");
    if (lower.includes("hbo")) return require("../static/hbo.png");
    if (lower.includes("rtl")) return require("../static/rtl.png");
    if (lower.includes("nova")) return require("../static/novabih.png");
    return require("../static/default.png");
  };

  const prikazGrupe = () => (
    <FlatList
      data={grupe}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.groupBtn}
          onPress={() => setOdabranaGrupa(item)}
        >
          <Text style={styles.groupText}>{item}</Text>
        </TouchableOpacity>
      )}
    />
  );

  const prikazKanala = () => {
    const kanaliGrupe = kanali.filter((k) => k.group === odabranaGrupa);

    if (kanaliGrupe.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={{ color: "gray" }}>
            Nema dostupnih kanala u ovoj grupi.
          </Text>
          <TouchableOpacity onPress={() => setOdabranaGrupa(null)}>
            <Text style={{ color: "#00ffcc", marginTop: 10 }}>⬅ Nazad</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setOdabranaGrupa(null)}
        >
          <Text style={{ color: "#00ffcc", fontSize: 16 }}>⬅ Nazad na grupe</Text>
        </TouchableOpacity>

        <FlatList
          data={kanaliGrupe}
          numColumns={isTV ? 1 : 2}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate("Player", {
                  kanal: item,
                  lista: kanaliGrupe,
                })
              }
            >
              <Image source={getLogo(item.name)} style={styles.logo} />
              <Text style={styles.name}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ffcc" />
        <Text style={{ color: "white", marginTop: 10 }}>
          Učitavanje kanala...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "red" }}>Greška pri učitavanju kanala.</Text>
        <TouchableOpacity onPress={ucitajKanale} style={{ marginTop: 15 }}>
          <Text style={{ color: "#00ffcc" }}>🔄 Pokušaj ponovo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {odabranaGrupa ? odabranaGrupa : "📺 Kategorije kanala"}
      </Text>
      {odabranaGrupa ? prikazKanala() : prikazGrupe()}
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
  groupBtn: {
    backgroundColor: "#1e1e1e",
    margin: 10,
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  groupText: { color: "white", fontSize: 18 },
  item: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    margin: 6,
    borderRadius: 10,
    padding: 10,
  },
  logo: { width: 80, height: 80, marginBottom: 5, borderRadius: 10 },
  name: { color: "white", fontSize: 14, textAlign: "center" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    margin: 10,
  },
});
