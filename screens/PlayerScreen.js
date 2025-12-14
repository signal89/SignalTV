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
import { VideoView } from "expo-video"; // NOVO

export default function PlayerScreen({ route, navigation }) {
  const { channelList = [], index = 0 } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(index);
  const [showOverlay, setShowOverlay] = useState(false);
  const videoRef = useRef(null);

  const channel = channelList[currentIndex];
  const { width, height } = Dimensions.get("window");

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
    if (channel?.url) {
      console.log("PLAY URL:", channel.url);
    }
  }, [channel]);

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

  return (
    <View style={styles.container}>
      {/* Video preko cijelog ekrana */}
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPress={toggleOverlay}
      >
        <VideoView
          ref={videoRef}
          source={{ uri: channel.url }}
          style={{ width, height }}
          contentFit="contain"
          autoplay
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          onError={(e) => {
            console.log(
              "Video error full:",
              JSON.stringify(e, null, 2)
            );
          }}
        />
      </TouchableOpacity>

      {/* Naziv kanala / epizode pri dnu */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText} numberOfLines={1}>
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
            <Text style={styles.listTitle}>Lista</Text>
            <FlatList
              data={channelList}
              keyExtractor={(item, idx) =>
                (item.url || item.name || "chan") + idx
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
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={5}
              removeClippedSubviews={true}
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
  titleBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  titleText: { color: "#fff", fontSize: 16, textAlign: "center" },

  overlay: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 40,
    bottom: 80,
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
    flex: 1,
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
