import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dobrodošli u SignalTV</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("Mode")}
      >
        <Text style={styles.txt}>Nastavi</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  title: { color: "#fff", fontSize: 24, marginBottom: 30 },
  btn: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8 },
  txt: { color: "#fff", fontWeight: "bold" },
});
