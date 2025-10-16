import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, BackHandler, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { Video } from "expo-video";

export default function PlayerScreen({ route, navigation }) {
  const { kanal, lista } = route.params;
  const [currentIndex, setCurrentIndex] = useState(
    lista.findIndex((k) => k.name === kanal.name)
  );
  const [showList, setShowList] = useState(false);

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

  const currentChannel = lista[currentIndex] || kanal;

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
      <Text style={styles.title}>{currentChannel.name}</Text>
      <Video
        key={currentChannel.url}
        source={{ uri: currentChannel.url }}
        style={styles.video}
        useNativeControls
        resizeMode="cover"
        shouldPlay
      />
      <View style={styles.controls}>
        <TouchableOpacity onPress={prevChannel} style={styles.button}>
          <Text style={styles.btnText}>⏮️ PREV</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowList(!showList)} style={styles.button}>
          <Text style={styles.btnText}>📺 KANALI</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={nextChannel} style={styles.button}>
          <Text style={styles.btnText}>⏭️ NEXT</Text>
        </TouchableOpacity>
      </View>

      {showList && (
        <View style={styles.listOverlay}>
          <FlatList
            data={lista}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  setCurrentIndex(index);
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

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  title: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginVertical: 10,
  },
  video: {
    width: width,
    height: height * 0.6,
    alignSelf: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#00aaff",
    padding: 10,
    borderRadius: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
  },
  listOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "50%",
    backgroundColor: "#111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
  },
  listItem: {
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#333",
  },
  listText: {
    color: "white",
    fontSize: 16,
  },
});
