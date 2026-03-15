// screens/ModeScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ModeScreen({ navigation }) {
  const [focusedBtn, setFocusedBtn] = useState("phone");

  const chooseMode = async (mode) => {
    try {
      await AsyncStorage.multiSet([
        ["signal_mode", mode],
        ["signal_seen_mode", "1"],
      ]);

      const seen = await AsyncStorage.getItem("signal_seen_mode");
      const savedMode = await AsyncStorage.getItem("signal_mode");
      console.log("SAVED:", seen, savedMode);

      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (e) {
      console.log("MODE SAVE ERROR:", e);
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    }
  };

  const width = Dimensions.get("window").width;
  const isTvLike = Platform.isTV || width >= 900;
  const btnWidth = isTvLike ? Math.min(width - 120, 520) : width - 80;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Izaberi način rada</Text>

      <TouchableOpacity
        focusable={true}
        hasTVPreferredFocus={true}
        onFocus={() => setFocusedBtn("phone")}
        style={[
          styles.btn,
          { width: btnWidth },
          focusedBtn === "phone" && styles.btnFocused,
        ]}
        onPress={() => chooseMode("phone")}
      >
        <Text
          style={[
            styles.btnText,
            focusedBtn === "phone" && styles.btnTextFocused,
          ]}
        >
          Telefon
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        focusable={true}
        onFocus={() => setFocusedBtn("tv")}
        style={[
          styles.btn,
          { width: btnWidth },
          focusedBtn === "tv" && styles.btnFocused,
        ]}
        onPress={() => chooseMode("tv")}
      >
        <Text
          style={[
            styles.btnText,
            focusedBtn === "tv" && styles.btnTextFocused,
          ]}
        >
          TV
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        focusable={true}
        onFocus={() => setFocusedBtn("box")}
        style={[
          styles.btn,
          { width: btnWidth },
          focusedBtn === "box" && styles.btnFocused,
        ]}
        onPress={() => chooseMode("box")}
      >
        <Text
          style={[
            styles.btnText,
            focusedBtn === "box" && styles.btnTextFocused,
          ]}
        >
          Box
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>Ovaj izbor vidiš samo prvi put.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  title: {
    color: "#fff",
    fontSize: 28,
    marginBottom: 30,
    fontWeight: "bold",
    textAlign: "center",
  },

  btn: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    marginVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  btnFocused: {
    borderColor: "#FFD700",
    borderWidth: 4,
    backgroundColor: "#1565C0",
    transform: [{ scale: 1.05 }],
  },

  btnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  btnTextFocused: {
    color: "#FFD700",
  },

  hint: {
    color: "#999",
    marginTop: 20,
    textAlign: "center",
    paddingHorizontal: 20,
    fontSize: 16,
  },
});
