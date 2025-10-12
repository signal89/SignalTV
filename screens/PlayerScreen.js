import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

export default function PlayerScreen({ route, navigation }) {
  const { kanal, sviKanali } = route.params;
  const [trenutniKanal, setTrenutniKanal] = useState(kanal);
  const [showList, setShowList] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerRef = useRef(null);

  const index = sviKanali.findIndex((k) => k.name === trenutniKanal.name);

  const sljedeci = () => {
    if (index < sviKanali.length - 1) setTrenutniKanal(sviKanali[index + 1]);
  };

  const prethodni = () => {
    if (index > 0) setTrenutniKanal(sviKanali[index - 1]);
  };

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await playerRef.current.dismissFullscreenPlayer();
      setIsFullscreen(false);
    } else {
      await playerRef.current.presentFullscreenPlayer();
      setIsFullscreen(true);
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: trenutniKanal.name });
  }, [trenutniKanal]);

  return (
    <View style={styles.container}>
      <Video
        ref={playerRef}
        source={{ uri: trenutniKanal.url }}
        style={isFullscreen ? styles.fullscreenVideo : styles.video}
        useNativeControls
        resizeMode="contain"
        shouldPlay
        onError={(e) => console.log("Greška u streamu:", e)}
      />

      {!isFullscreen && (
        <View style={styles.controls}>
          <TouchableOpacity onPress={prethodni} style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={32} color="#00ffcc" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFullscreen} style={styles.controlButton}>
            <Ionicons name="resize" size={32} color="#00ffcc" />
          </TouchableOpacity>
          <TouchableOpacity onPress={sljedeci} style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={32} color="#00ffcc" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowList(!showList)} style={styles.controlButton}>
            <Ionicons name="list" size={32} color="#00ffcc" />
          </TouchableOpacity>
        </View>
      )}

      {showList && (
        <View style={styles.listContainer}>
          <FlatList
            data={sviKanali}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.listItem,
                  item.name === trenutniKanal.name && styles.activeItem,
                ]}
                onPress={() => {
                  setTrenutniKanal(item);
                  setShowList(false);
                }}
              >
                <Text style={styles.listText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  video: { width: "100%", height: height * 0.35, backgroundColor: "black" },
  fullscreenVideo: { width: "100%", height: "100%" },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "#111",
  },
  controlButton: { padding: 5 },
  listContainer: {
    flex: 1,
    backgroundColor: "#000",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  listItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#222" },
  activeItem: { backgroundColor: "#00ffcc33" },
  listText: { color: "white", fontSize: 15 },
});
