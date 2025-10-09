import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, BackHandler } from "react-native";
import { Video } from "expo-av";

export default function PlayerScreen({ route, navigation }) {
  const { kanal, lista } = route.params;
  const [currentIndex, setCurrentIndex] = useState(
    lista.findIndex(k => k.name === kanal.name)
  );
  const [showList, setShowList] = useState(false);
  const videoRef = useRef(null);

  const current = lista[currentIndex];

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (showList) {
        setShowList(false);
        return true;
      }
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, [showList]);

  const nextChannel = () => {
    const next = (currentIndex + 1) % lista.length;
    setCurrentIndex(next);
  };

  const prevChannel = () => {
    const prev = (currentIndex - 1 + lista.length) % lista.length;
    setCurrentIndex(prev);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.videoWrapper}
        onPress={() => setShowList(!showList)}
      >
        <Video
          ref={videoRef}
          source={{ uri: current.url }}
          style={styles.video}
          useNativeControls
          resizeMode="cover"
          shouldPlay
        />
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

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  videoWrapper: { flex: 1 },
  video: { width, height },
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
    width: width * 0.6,
    height: height,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  channelItem: {
    padding: 10,
    borderBottomColor: "#333",
    borderBottomWidth: 1,
  },
  channelText: {
    color: "white",
    fontSize: 16,
  },
});
