import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ModeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Izaberi način</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.txt}>Pokreni aplikaciju</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  title: { color: "#fff", fontSize: 22, marginBottom: 30 },
  btn: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8 },
  txt: { color: "#fff", fontWeight: "bold" },
});
