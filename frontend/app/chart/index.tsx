import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Web-only fallback for the Chart screen.
// The real Garmin-style chart with maps and GPS is implemented in index.native.tsx
// and will run on iOS/Android (Expo Go or native builds).

const GARMIN_BG = "#020617";
const GARMIN_ACCENT = "#22d3ee";
const GARMIN_TEXT = "#e5e7eb";

export default function ChartScreenWeb() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Chart view is native-only</Text>
        <Text style={styles.text}>
          The full Garmin-style navigation chart (with GPS and marine map tiles) runs on iOS and Android.
        </Text>
        <Text style={[styles.text, { marginTop: 8 }]}>Open this project in Expo Go or a native build to see it.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GARMIN_BG,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: GARMIN_ACCENT,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  text: {
    color: GARMIN_TEXT,
    fontSize: 14,
    textAlign: "center",
  },
});
