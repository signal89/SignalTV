// screens/PlayerScreen.js
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  BackHandler,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

export default function PlayerScreen({ route, navigation }) {
  const { channelList = [], index = 0 } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(index);
  const videoRef = useRef(null);

  const channel = channelList[currentIndex];
  const { width } = Dimensions.get("window");
  const videoHeight = (width * 9) / 16;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        navigation.goBack();
        return true;
      }
    );
    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    if (channel?.url) {
      console.log("PLAY URL:", channel.url);
      videoRef.current?.stopAsync?.();
      videoRef.current?.loadAsync(
        { uri: channel.url },
        { shouldPlay: true },
        false
      );
    }
  }, [channel]);

  const next = () => {
    if (currentIndex < channelList.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  if (!channel) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Nema dostupnog kanala.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        style={{ width, height: videoHeight }}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        shouldPlay
        source={{ uri: channel.url }}
        onError={(e) =>
          console.log("Video error:", JSON.stringify(e, null, 2))
        }
      />

      <Text style={styles.title} numberOfLines={1}>
        {channel.name}
      </Text>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={prev}>
          <Text style={styles.ctrlText}>Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.ctrlText}>Exit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrlBtn} onPress={next}>
          <Text style={styles.ctrlText}>Next</Text>
        </TouchableOpacity>
      </View>

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
        style={{ flex: 1, marginTop: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 8 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  emptyText: { color: "#fff", fontSize: 18 },

  title: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    marginTop: 6,
  },

  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  ctrlBtn: {
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  ctrlText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  listItem: {
    padding: 10,
    borderRadius: 6,
    marginVertical: 3,
    backgroundColor: "#222",
  },
  listItemActive: {
    backgroundColor: "#555",
    borderWidth: 2,
    borderColor: "#fff",
  },
  listText: { color: "#fff", fontSize: 16 },
});
