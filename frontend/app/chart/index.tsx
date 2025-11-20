import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CAMO_DARK = "#2d3a1f";
const ORANGE_ACCENT = "#ff6b1a";
const ORANGE_TEXT = "#ff8c42";

// Fallback chart screen (no native imports)
export default function ChartScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🦆 NaviGator Chart</Text>
        <Text style={styles.subtitle}>Mobile Device Required</Text>
        <Text style={styles.text}>
          The navigation chart with GPS and maps is available on mobile devices.
        </Text>
        <Text style={[styles.text, { marginTop: 20, fontWeight: "600", fontSize: 16 }]}>
          📱 Use Expo Go on your phone
        </Text>
        <Text style={[styles.text, { marginTop: 12 }]}>
          1. Download "Expo Go" from App Store or Play Store
        </Text>
        <Text style={styles.text}>
          2. Open Expo Go and scan the QR code
        </Text>
        <Text style={styles.text}>
          3. See full NaviGator with camo theme!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CAMO_DARK,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    color: ORANGE_ACCENT,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: ORANGE_TEXT,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  text: {
    color: ORANGE_TEXT,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
