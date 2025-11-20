import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CAMO_DARK = "#2d3a1f";
const ORANGE_ACCENT = "#ff6b1a";
const ORANGE_TEXT = "#ff8c42";

// Only import ChartNative on actual native platforms
const ChartNative = Platform.OS !== "web" ? require("../../src/components/ChartNative").default : null;

export default function ChartScreen() {
  // Use native chart on iOS/Android
  if (ChartNative && Platform.OS !== "web") {
    return <ChartNative />;
  }

  // Web fallback
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>🦆 NaviGator Chart</Text>
        <Text style={styles.subtitle}>Mobile App Only</Text>
        <Text style={styles.text}>
          This marine navigation app is designed for mobile devices with GPS.
        </Text>
        <Text style={[styles.text, { marginTop: 16, fontWeight: "600" }]}>
          📱 Download Expo Go on your phone:
        </Text>
        <Text style={[styles.text, { marginTop: 8 }]}>
          iOS: App Store → "Expo Go"
        </Text>
        <Text style={styles.text}>
          Android: Play Store → "Expo Go"  
        </Text>
        <Text style={[styles.text, { marginTop: 16 }]}>
          Then scan the QR code to see NaviGator with full camo theme and maps!
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
