import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Web-specific fallback for NaviGator Chart
// Maps and GPS features require native device capabilities

const CAMO_DARK = "#2d3a1f";
const ORANGE_ACCENT = "#ff6b1a";
const ORANGE_TEXT = "#ff8c42";

export default function ChartScreenWeb() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🦆 NaviGator Chart</Text>
        <Text style={styles.subtitle}>Native-Only Feature</Text>
        <Text style={styles.text}>
          The full marine navigation chart with GPS tracking and map tiles runs on iOS and Android devices.
        </Text>
        <Text style={[styles.text, { marginTop: 16 }]}>
          📱 Open in Expo Go or build a native APK to use:
        </Text>
        <Text style={[styles.feature, { marginTop: 8 }]}>• Live GPS with SOG/COG</Text>
        <Text style={styles.feature}>• Route navigation with ETA</Text>
        <Text style={styles.feature}>• Waypoint markers</Text>
        <Text style={styles.feature}>• Native maps</Text>
        <Text style={[styles.text, { marginTop: 24, color: "#8a9077", fontSize: 12 }]}>
          This app is designed for native mobile platforms.
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
    paddingHorizontal: 24,
  },
  title: {
    color: ORANGE_ACCENT,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    color: ORANGE_TEXT,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  text: {
    color: ORANGE_TEXT,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  feature: {
    color: "#8a9077",
    fontSize: 13,
    textAlign: "center",
  },
});
