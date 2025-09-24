import React from "react";
import { View, Text, Button } from "react-native";

export default function WelcomeScreen({ onClose }) {
  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", padding:20 }}>
      <Text style={{ fontSize:22, marginBottom:20, textAlign:"center" }}>
        Dobrodošli u SignalTV!
      </Text>
      <Text style={{ textAlign:"center", marginBottom:20 }}>
        Ovdje možete gledati omiljene TV kanale iz BiH, Hrvatske i Srbije,
        uključujući sportske i filmske kanale. 
      </Text>
      <Button title="Zatvori" onPress={onClose} />
    </View>
  );
}
