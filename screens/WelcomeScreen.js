import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dobrodošli u SignalTV</Text>
      <Text style={styles.subtitle}>Jednom izaberi uređaj — sljedeći put ide direktno na aplikaciju.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Mode")}>
        <Text style={styles.btnText}>Nastavi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 20 },
  title: { color: "#fff", fontSize: 26, marginBottom: 8 },
  subtitle: { color: "#aaa", textAlign: "center", marginBottom: 24 },
  btn: { backgroundColor: "#007AFF", padding: 14, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "bold" },
});
