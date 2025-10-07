import React, { useEffect } from "react";
import { View, Text, StyleSheet, BackHandler } from "react-native";
import { Video } from "expo-av";

export default function PlayerScreen({ route, navigation }) {
  const { kanal } = route.params;

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      navigation.goBack();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{kanal.naziv}</Text>
      <Video
        source={{ uri: kanal.url }}
        style={styles.video}
        useNativeControls
        resizeMode="contain"
        shouldPlay
      />
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
    height: "90%",
    marginTop: 10,
  },
});
