import React from "react";
import { View, Button, StyleSheet, Text } from "react-native";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SignalTV</Text>
      <Button
        title="📺 Otvori listu kanala"
        onPress={() => navigation.navigate("Lista kanala")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  title: { color: "white", fontSize: 26, fontWeight: "bold", marginBottom: 20 },
});
