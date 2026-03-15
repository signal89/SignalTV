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
  Platform,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

export default function PlayerScreen({ route, navigation }) {
  const { channelList = [], index = 0 } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(index);
  const [focusedIndex, setFocusedIndex] = useState(index);
  const [controlFocus, setControlFocus] = useState("exit");
  const [videoError, setVideoError] = useState("");
  const [isBuffering, setIsBuffering] = useState(true);
  const videoRef = useRef(null);

  const realChannel = channelList[currentIndex];

  const fallbackChannel = {
    name: "Test video",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  };

  const channel = realChannel || fallbackChannel;

  const { width, height } = Dimensions.get("window");
  const isTvLike = Platform.isTV || width >= 900;
  const videoHeight = isTvLike ? Math.min(height * 0.42, 360) : (width * 9) / 16;

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
    setVideoError("");
    setIsBuffering(true);
  }, [currentIndex]);

  const next = () => {
    if (currentIndex < channelList.length - 1) {
      setCurrentIndex((i) => i + 1);
      setFocusedIndex((i) => Math.min(i + 1, channelList.length - 1));
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setFocusedIndex((i) => Math.max(i - 1, 0));
    }
  };

  const retryCurrent = async () => {
    try {
      setVideoError("");
      setIsBuffering(true);
      await videoRef.current?.unloadAsync?.();
      await videoRef.current?.loadAsync?.(
        { uri: channel.url },
        { shouldPlay: true }
      );
    } catch (e) {
      console.log("Retry error:", e);
      setVideoError("Greška pri ponovnom učitavanju streama.");
      setIsBuffering(false);
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
      <View style={styles.videoWrap}>
        <Video
          key={channel.url}
          ref={videoRef}
          style={{ width: "100%", height: videoHeight, backgroundColor: "#000" }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          source={{ uri: channel.url }}
          onLoadStart={() => {
            setIsBuffering(true);
            setVideoError("");
          }}
          onLoad={() => {
            setIsBuffering(false);
            setVideoError("");
          }}
          onReadyForDisplay={() => {
            setIsBuffering(false);
          }}
          onPlaybackStatusUpdate={(status) => {
            if (status?.isLoaded) {
              setIsBuffering(!!status.isBuffering);
            } else if (status?.error) {
              setVideoError(String(status.error));
              setIsBuffering(false);
            }
          }}
          onError={(e) => {
            console.log("Video error:", JSON.stringify(e, null, 2));
            setVideoError("Stream se ne može pokrenuti na ovom uređaju.");
            setIsBuffering(false);
          }}
        />

        {isBuffering && !videoError ? (
          <View style={styles.overlayBox}>
            <Text style={styles.overlayText}>Učitavanje streama...</Text>
          </View>
        ) : null}

        {videoError ? (
          <View style={styles.overlayBox}>
            <Text style={styles.overlayTitle}>Player error</Text>
            <Text style={styles.overlayText}>{videoError}</Text>
            <Text style={styles.overlaySmall} numberOfLines={2}>
              {channel.url}
            </Text>

            <TouchableOpacity
              focusable={true}
              style={[styles.retryBtn, controlFocus === "retry" && styles.ctrlBtnFocused]}
              onFocus={() => setControlFocus("retry")}
              onPress={retryCurrent}
            >
              <Text style={styles.ctrlText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {channel.name}
      </Text>

      <View style={styles.controlsRow}>
        <TouchableOpacity
          focusable={true}
          style={[styles.ctrlBtn, controlFocus === "prev" && styles.ctrlBtnFocused]}
          onFocus={() => setControlFocus("prev")}
          onPress={prev}
        >
          <Text style={styles.ctrlText}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          focusable={true}
          style={[styles.ctrlBtn, controlFocus === "exit" && styles.ctrlBtnFocused]}
          onFocus={() => setControlFocus("exit")}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.ctrlText}>Exit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          focusable={true}
          style={[styles.ctrlBtn, controlFocus === "next" && styles.ctrlBtnFocused]}
          onFocus={() => setControlFocus("next")}
          onPress={next}
        >
          <Text style={styles.ctrlText}>Next</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={channelList}
        keyExtractor={(item, idx) => (item.url || item.name || "chan") + idx}
        extraData={{ currentIndex, focusedIndex }}
        renderItem={({ item, index: idx }) => {
          const focused = idx === focusedIndex;
          const active = idx === currentIndex;

          return (
            <TouchableOpacity
              focusable={true}
              activeOpacity={0.85}
              hasTVPreferredFocus={idx === index}
              onFocus={() => setFocusedIndex(idx)}
              style={[
                styles.listItem,
                active && styles.listItemActive,
                focused && styles.listItemFocused,
              ]}
              onPress={() => {
                console.log("CLICKED IN PLAYER:", item.name, item.url);
                setCurrentIndex(idx);
                setFocusedIndex(idx);
              }}
            >
              <Text
                style={[styles.listText, focused && styles.listTextFocused]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 8,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },

  emptyText: {
    color: "#fff",
    fontSize: 18,
  },

  videoWrap: {
    width: "100%",
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "bold",
  },

  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },

  ctrlBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  ctrlBtnFocused: {
    borderColor: "#FFD700",
    borderWidth: 4,
    backgroundColor: "#1565C0",
    transform: [{ scale: 1.04 }],
  },

  ctrlText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  list: {
    flex: 1,
    marginTop: 8,
  },

  listContent: {
    paddingBottom: 20,
  },

  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: "#222",
    borderWidth: 2,
    borderColor: "transparent",
  },

  listItemActive: {
    backgroundColor: "#444",
  },

  listItemFocused: {
    borderColor: "#FFD700",
    borderWidth: 4,
    backgroundColor: "#333",
    transform: [{ scale: 1.03 }],
  },

  listText: {
    color: "#fff",
    fontSize: 16,
  },

  listTextFocused: {
    color: "#FFD700",
    fontSize: 17,
    fontWeight: "bold",
  },

  overlayBox: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 14,
    borderRadius: 10,
    maxWidth: "90%",
    alignItems: "center",
  },

  overlayTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  overlayText: {
    color: "#fff",
    fontSize: 15,
    textAlign: "center",
  },

  overlaySmall: {
    color: "#bbb",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 10,
  },

  retryBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
});
