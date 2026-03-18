import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  BackHandler,
  Platform,
  Pressable,
} from "react-native";
import { Video, ResizeMode } from "expo-av";

export default function PlayerScreen({ route, navigation }) {
  const { channelList = [], index = 0 } = route.params || {};

  const [currentIndex, setCurrentIndex] = useState(index);
  const [focusedIndex, setFocusedIndex] = useState(index);
  const [controlFocus, setControlFocus] = useState("exit");
  const [videoError, setVideoError] = useState("");
  const [isBuffering, setIsBuffering] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);

  const videoRef = useRef(null);

  const realChannel = channelList[currentIndex];

  const fallbackChannel = {
    name: "Test video",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  };

  const channel = realChannel || fallbackChannel;
  const isTvLike = Platform.isTV;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (showOverlay) {
          setShowOverlay(false);
          return true;
        }

        navigation.goBack();
        return true;
      }
    );

    return () => backHandler.remove();
  }, [navigation, showOverlay]);

  useEffect(() => {
    setVideoError("");
    setIsBuffering(true);
    setShowOverlay(false);
    setControlFocus("exit");
  }, [currentIndex]);

  const next = () => {
    if (currentIndex < channelList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFocusedIndex((prev) => Math.min(prev + 1, channelList.length - 1));
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
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

  const toggleOverlay = () => {
    setShowOverlay((prev) => !prev);
  };

  if (!channel) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Nema dostupnog kanala.</Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.container} onPress={toggleOverlay}>
      <View style={styles.videoWrap}>
        <Video
          ref={videoRef}
          source={{ uri: channel.url }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          useNativeControls={false}
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
            setShowOverlay(true);
          }}
        />

        {!showOverlay && !videoError ? (
          <View style={styles.channelBadge}>
            <Text style={styles.channelBadgeText}>{channel.name}</Text>
          </View>
        ) : null}

        {videoError ? (
          <View style={styles.errorOverlay}>
            <Text style={styles.overlayTitle}>Player error</Text>
            <Text style={styles.overlayText}>{videoError}</Text>
            <Text style={styles.overlaySmall}>{channel.url}</Text>

            <TouchableOpacity
              focusable={true}
              onFocus={() => setControlFocus("retry")}
              onPress={retryCurrent}
              style={[
                styles.retryBtn,
                controlFocus === "retry" && styles.ctrlBtnFocused,
              ]}
            >
              <Text style={styles.ctrlText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {showOverlay ? (
          <View style={styles.overlay}>
            <View style={styles.overlayTop}>
              <Text style={styles.title}>{channel.name}</Text>

              <View style={styles.controlsRow}>
                <TouchableOpacity
                  focusable={true}
                  onFocus={() => setControlFocus("prev")}
                  onPress={prev}
                  style={[
                    styles.ctrlBtn,
                    controlFocus === "prev" && styles.ctrlBtnFocused,
                  ]}
                >
                  <Text style={styles.ctrlText}>Prev</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  focusable={true}
                  hasTVPreferredFocus={true}
                  onFocus={() => setControlFocus("exit")}
                  onPress={() => navigation.goBack()}
                  style={[
                    styles.ctrlBtn,
                    controlFocus === "exit" && styles.ctrlBtnFocused,
                  ]}
                >
                  <Text style={styles.ctrlText}>Exit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  focusable={true}
                  onFocus={() => setControlFocus("next")}
                  onPress={next}
                  style={[
                    styles.ctrlBtn,
                    controlFocus === "next" && styles.ctrlBtnFocused,
                  ]}
                >
                  <Text style={styles.ctrlText}>Next</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.overlayHint}>
                OK sakriva/prikazuje meni
              </Text>
            </View>

            <View style={styles.overlayBottom}>
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
                      onFocus={() => setFocusedIndex(idx)}
                      onPress={() => {
                        setCurrentIndex(idx);
                        setFocusedIndex(idx);
                      }}
                      style={[
                        styles.listItem,
                        active && styles.listItemActive,
                        focused && styles.listItemFocused,
                      ]}
                    >
                      <Text
                        style={[
                          styles.listText,
                          focused && styles.listTextFocused,
                        ]}
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
          </View>
        ) : null}

        {isBuffering && !videoError && !showOverlay ? (
          <View style={styles.bufferBadge}>
            <Text style={styles.bufferBadgeText}>Učitava...</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
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
    flex: 1,
    backgroundColor: "#000",
  },

  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  channelBadge: {
    position: "absolute",
    top: 22,
    left: 18,
    right: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "center",
  },

  channelBadgeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },

  bufferBadge: {
    position: "absolute",
    bottom: 26,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  bufferBadgeText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.60)",
    justifyContent: "space-between",
  },

  overlayTop: {
    paddingTop: 24,
    paddingHorizontal: 12,
  },

  title: {
    color: "#fff",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },

  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
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

  overlayHint: {
    color: "#ddd",
    textAlign: "center",
    marginBottom: 8,
    fontSize: 14,
  },

  overlayBottom: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 10,
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: 20,
  },

  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: "rgba(34,34,34,0.95)",
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

  errorOverlay: {
    position: "absolute",
    alignSelf: "center",
    top: "20%",
    backgroundColor: "rgba(0,0,0,0.82)",
    padding: 16,
    borderRadius: 12,
    maxWidth: "92%",
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
    marginBottom: 12,
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
