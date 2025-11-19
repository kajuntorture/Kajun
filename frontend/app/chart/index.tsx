import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Platform-aware Chart screen
const CAMO_DARK = "#2d3a1f";
const ORANGE_ACCENT = "#ff6b1a";
const ORANGE_TEXT = "#ff8c42";

// Dynamically import native component only on native platforms
let ChartNative: any = null;
if (Platform.OS === "ios" || Platform.OS === "android") {
  ChartNative = require("./_ChartNative").default;
}

export default function ChartScreen() {
  // On native platforms, use the full chart with maps
  if (ChartNative) {
    return <ChartNative />;
  }

  // On web, show fallback message
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🦆 NaviGator Chart</Text>
        <Text style={styles.subtitle}>Native-Only Feature</Text>
        <Text style={styles.text}>
          The full marine navigation chart with GPS tracking and map tiles runs on iOS and Android devices.
        </Text>
        <Text style={[styles.text, { marginTop: 16 }]}>
          📱 Open in Expo Go on your device to use:
        </Text>
        <Text style={[styles.feature, { marginTop: 8 }]}>• Live GPS with SOG/COG</Text>
        <Text style={styles.feature}>• Route navigation with ETA</Text>
        <Text style={styles.feature}>• Waypoint markers & routes</Text>
        <Text style={styles.feature}>• Native maps with camo theme</Text>
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
