import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  BackHandler,
} from "react-native";
import { Video } from "expo-av";

export default function PlayerScreen({ route, navigation }) {
  const { channelList = [], index = 0 } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(index);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef(null);

  const channel = channelList[currentIndex];

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (showOverlay) {
          setShowOverlay(false);
          return true;
        }
        return false;
      }
    );
    return () => backHandler.remove();
  }, [showOverlay]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const next = () => {
    if (currentIndex < channelList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const toggleOverlay = () => setShowOverlay((v) => !v);

  if (!channel) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>
          Nema dostupnog kanala za reproduciranje.
        </Text>
      </View>
    );
  }

  const { width } = Dimensions.get("window");
  const videoHeight = (width * 9) / 16;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        style={{ width: "100%", alignItems: "center" }}
        onPress={toggleOverlay}
      >
        <Video
          ref={videoRef}
          source={{ uri: channel.url }}
          style={{
            width: width,
            height: videoHeight,
            backgroundColor: "black",
          }}
          useNativeControls
          resizeMode="contain" // ovdje kasnije možeš dodati modove (contain/cover/stretch)
          onError={(e) => {
            console.log("Video error:", e);
          }}
        />
      </TouchableOpacity>

      <View style={{ padding: 10 }}>
        <Text style={styles.title} numberOfLines={1}>
          {channel.name}
        </Text>
      </View>

      {showOverlay && (
        <View style={styles.overlay}>
          <View style={styles.overlayRow}>
            <TouchableOpacity
              style={styles.ovBtn}
              onPress={prev}
              disabled={currentIndex === 0}
            >
              <Text style={styles.ovText}>⟨ Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ovBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.ovText}>Exit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ovBtn}
              onPress={next}
              disabled={currentIndex === channelList.length - 1}
            >
              <Text style={styles.ovText}>Next ⟩</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Lista kanala</Text>
            <FlatList
              data={channelList}
              keyExtractor={(it, idx) =>
                (it.url || it.name || "chan") + idx
              }
              renderItem={({ item, index: idx }) => (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    idx === currentIndex && styles.listItemActive,
                  ]}
                  onPress={() => setCurrentIndex(idx)}
                >
                  <Text style={styles.listText} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 220 }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  title: { color: "#fff", fontSize: 18, textAlign: "center" },

  // overlay je sada manji panel, ne preko cijelog ekrana
  overlay: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 10,
    backgroundColor: "rgba(0,0,0,0.85)",
    padding: 10,
    borderRadius: 8,
  },
  overlayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ovBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#007AFF",
    minWidth: 90,
    alignItems: "center",
  },
  ovText: { color: "#fff", fontWeight: "bold" },

  listContainer: {
    marginTop: 8,
    maxHeight: 220,
  },
  listTitle: {
    color: "#fff",
    marginBottom: 4,
    fontWeight: "bold",
  },
  listItem: {
    padding: 8,
    borderRadius: 6,
    marginVertical: 2,
    backgroundColor: "#222",
  },
  listItemActive: {
    backgroundColor: "#007AFF",
  },
  listText: { color: "#fff" },
});
