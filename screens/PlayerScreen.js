import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, BackHandler, TouchableOpacity } from "react-native";
import { Video } from "expo-av";

export default function PlayerScreen({ route, navigation }) {
  const { kanal } = route.params;
  const playerRef = useRef(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{kanal.name}</Text>
      <Video
        ref={playerRef}
        source={{ uri: kanal.url }}
        style={styles.video}
        useNativeControls
        resizeMode="contain"
        shouldPlay
      />

      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>⬅ Nazad</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => playerRef.current && playerRef.current.presentFullscreenPlayer()}
        >
          <Text style={styles.btnText}>⛶ Fullscreen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", justifyContent: "center" },
  title: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginTop: 10,
  },
  video: {
    width: "100%",
    height: "80%",
    marginTop: 10,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  btn: {
    backgroundColor: "#1e1e1e",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  btnText: {
    color: "white",
    fontSize: 14,
  },
});
