import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  BackHandler,
  Modal,
} from "react-native";
import { Video } from "expo-av";

export default function PlayerScreen({ route, navigation }) {
  const { kanal, lista } = route.params;
  const [currentIndex, setCurrentIndex] = useState(
    lista.findIndex((k) => k.name === kanal.name)
  );
  const [showList, setShowList] = useState(false);
  const [showAspectMenu, setShowAspectMenu] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("cover");

  const videoRef = useRef(null);
  const current = lista[currentIndex];
  const { width, height } = Dimensions.get("window");

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (showList) {
          setShowList(false);
          return true;
        }
        if (showAspectMenu) {
          setShowAspectMenu(false);
          return true;
        }
        navigation.goBack();
        return true;
      }
    );
    return () => backHandler.remove();
  }, [showList, showAspectMenu]);

  const nextChannel = () => setCurrentIndex((currentIndex + 1) % lista.length);
  const prevChannel = () =>
    setCurrentIndex((currentIndex - 1 + lista.length) % lista.length);

  const aspectOptions = [
    { label: "16:9", value: "contain" },
    { label: "18:9", value: "cover" },
    { label: "20:9", value: "stretch" },
    { label: "4:3", value: "center" },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.videoWrapper}
        onPress={() => setShowList(!showList)}
        onLongPress={() => setShowAspectMenu(true)}
        activeOpacity={1}
      >
        {current.url ? (
          <Video
            ref={videoRef}
            source={{ uri: current.url }}
            style={{ width, height }}
            useNativeControls
            resizeMode={aspectRatio}
            shouldPlay
          />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ Kanal trenutno nedostupan</Text>
          </View>
        )}
      </TouchableOpacity>

      {showList && (
        <View style={styles.overlay}>
          <FlatList
            data={lista}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.channelItem}
                onPress={() => {
                  setCurrentIndex(index);
                  setShowList(false);
                }}
              >
                <Text
                  style={[
                    styles.channelText,
                    index === currentIndex && { color: "#00ffcc" },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <Modal visible={showAspectMenu} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            {aspectOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  setAspectRatio(opt.value);
                  setShowAspectMenu(false);
                }}
                style={styles.aspectOption}
              >
                <Text style={styles.aspectText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <View style={styles.controls}>
        <TouchableOpacity onPress={prevChannel} style={styles.btn}>
          <Text style={styles.btnText}>⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={nextChannel} style={styles.btn}>
          <Text style={styles.btnText}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  videoWrapper: { flex: 1 },
  controls: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  btn: { padding: 10 },
  btnText: { fontSize: 28, color: "white" },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    width: Dimensions.get("window").width * 0.6,
    height: Dimensions.get("window").height,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  channelItem: { padding: 10, borderBottomColor: "#333", borderBottomWidth: 1 },
  channelText: { color: "white", fontSize: 16 },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 10,
  },
  aspectOption: {
    paddingVertical: 10,
  },
  aspectText: {
    color: "#00ffcc",
    fontSize: 18,
    textAlign: "center",
  },
  errorContainer: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { color: "white", fontSize: 18 },
});
