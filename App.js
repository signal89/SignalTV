// App.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();
const SERVER_URL = 'https://signaltv.onrender.com/api/channels'; // zamijeni sa tvojim serverom

function WelcomeScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  const enter = () => {
    if (code === 'Signal2112') navigation.replace('Mode');
    else setErr('❌ Pogrešan kod');
  };

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Dobrodošli u SignalTV</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="Unesi pristupni kod"
        secureTextEntry
      />
      {err ? <Text style={styles.error}>{err}</Text> : null}
      <Button title="Ulaz" onPress={enter} />
    </View>
  );
}

function ModeScreen({ navigation }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Odaberi način rada</Text>
      <Button title="📱 Telefon" onPress={() => navigation.replace('Home')} />
      <View style={{ height: 12 }} />
      <Button title="📺 TV / Box" onPress={() => navigation.replace('Home')} />
    </View>
  );
}

function HomeScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(SERVER_URL)
      .then(r => r.json())
      .then(j => {
        setData(j);
        setLoading(false);
      })
      .catch(e => {
        setLoading(false);
        Alert.alert('Greška', 'Ne mogu dohvatiti kanale');
      });
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Učitavanje...</Text>
      </View>
    );
  if (!data)
    return (
      <View style={styles.center}>
        <Text>Nema podataka</Text>
      </View>
    );

  const cats = Object.keys(data.categories || {}).filter(cat =>
    cat.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <TextInput
        style={styles.input}
        placeholder="Pretraga kategorija..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={cats}
        keyExtractor={i => i}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.channelButton}
            onPress={() =>
              navigation.navigate('Category', {
                category: item,
                payload: data.categories[item],
              })
            }
          >
            <Text style={styles.channelText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function CategoryScreen({ route, navigation }) {
  const { category, payload } = route.params;
  const groups = Object.keys(payload || {});

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={styles.title}>{category}</Text>
      <FlatList
        data={groups}
        keyExtractor={i => i}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.channelButton}
            onPress={() =>
              navigation.navigate('Group', {
                category,
                groupName: item,
                channels: payload[item],
              })
            }
          >
            <Text style={styles.channelText}>
              {item} ({payload[item].length})
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function GroupScreen({ route }) {
  const { groupName, channels } = route.params;

  const onPress = ch => {
    if (!ch.url) {
      Alert.alert('Nedostupan', 'Ovaj kanal nema URL');
      return;
    }
    Linking.openURL(ch.url).catch(() =>
      Alert.alert('Greška', 'Ne mogu otvoriti URL')
    );
  };

  const onLongPress = ch => {
    Alert.alert('Opcije kanala', ch.name, [
      { text: 'Otvori', onPress: () => onPress(ch) },
      { text: 'Kopiraj URL', onPress: () => {} },
      { text: 'Zatvori', style: 'cancel' },
    ]);
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={styles.title}>{groupName}</Text>
      <FlatList
        data={channels}
        keyExtractor={(item, idx) => item.name + idx}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.channelButton}
            onPress={() => onPress(item)}
            onLongPress={() => onLongPress(item)}
          >
            <Text style={styles.channelText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Mode" component={ModeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="Group" component={GroupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10, width: '100%' },
  channelButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginVertical: 6 },
  channelText: { color: '#fff', fontWeight: '700' },
  error: { color: 'red', marginBottom: 10 },
});
