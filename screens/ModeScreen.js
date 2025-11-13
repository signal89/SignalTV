import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ModeScreen({ navigation }) {
  const chooseMode = async (mode) => {
    try {
      await AsyncStorage.setItem("signal_mode", mode);
      await AsyncStorage.setItem("signal_seen_mode", "1");
      navigation.replace("Home");
    } catch (e) {
      navigation.replace("Home");
    }
  };

  const { width } = Dimensions.get("window");
  const btnWidth = width - 80;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Izaberi način rada</Text>
      <TouchableOpacity style={[styles.btn, { width: btnWidth }]} onPress={() => chooseMode("phone")}>
        <Text style={styles.btnText}>Telefon</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { width: btnWidth }]} onPress={() => chooseMode("tv")}>
        <Text style={styles.btnText}>TV</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, { width: btnWidth }]} onPress={() => chooseMode("box")}>
        <Text style={styles.btnText}>Box</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>Ovaj izbor vidiš samo prvi put.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", alignItems: "center", paddingTop: 80 },
  title: { color: "#fff", fontSize: 22, marginBottom: 30 },
  btn: { backgroundColor: "#007AFF", padding: 14, marginVertical: 10, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  hint: { color: "#999", marginTop: 20, textAlign: "center", paddingHorizontal: 20 },
});
