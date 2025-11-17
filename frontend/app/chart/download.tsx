import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";

const GARMIN_BG = "#020617";
const GARMIN_ACCENT = "#22d3ee";
const GARMIN_TEXT = "#e5e7eb";

const TILE_BASE_URL = "https://a.tile.openstreetmap.org";

function buildTileUrl(z: number, x: number, y: number) {
  return `${TILE_BASE_URL}/${z}/${x}/${y}.png`;
}

function deg2tile(lat: number, lon: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = 2 ** zoom;
  const xtile = Math.floor(((lon + 180) / 360) * n);
  const ytile = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x: xtile, y: ytile };
}

export default function ChartDownloadScreen() {
  const [north, setNorth] = useState("37.9");
  const [south, setSouth] = useState("37.6");
  const [east, setEast] = useState("-122.3");
  const [west, setWest] = useState("-122.6");
  const [minZoom, setMinZoom] = useState("10");
  const [maxZoom, setMaxZoom] = useState("14");
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const handleDownload = async () => {
    const n = parseFloat(north);
    const s = parseFloat(south);
    const e = parseFloat(east);
    const w = parseFloat(west);
    const minZ = parseInt(minZoom, 10);
    const maxZ = parseInt(maxZoom, 10);

    if (!Number.isFinite(n) || !Number.isFinite(s) || !Number.isFinite(e) || !Number.isFinite(w)) {
      Alert.alert("Invalid coordinates", "Please enter valid numeric bounding box values.");
      return;
    }
    if (minZ > maxZ || minZ < 5 || maxZ > 17) {
      Alert.alert("Invalid zoom", "Zoom range should be between 5 and 17, and min ≤ max.");
      return;
    }

    const downloads: { url: string; path: string }[] = [];

    for (let z = minZ; z <= maxZ; z += 1) {
      const nw = deg2tile(n, w, z);
      const se = deg2tile(s, e, z);
      const minX = Math.min(nw.x, se.x);
      const maxX = Math.max(nw.x, se.x);
      const minY = Math.min(nw.y, se.y);
      const maxY = Math.max(nw.y, se.y);

      for (let x = minX; x <= maxX; x += 1) {
        for (let y = minY; y <= maxY; y += 1) {
          const url = buildTileUrl(z, x, y);
          const path = `${FileSystem.documentDirectory}tiles/${z}/${x}/${y}.png`;
          downloads.push({ url, path });
        }
      }
    }

    if (downloads.length === 0) {
      Alert.alert("Nothing to download", "This area is too small or invalid.");
      return;
    }

    setTotal(downloads.length);
    setProgress(0);
    setIsDownloading(true);

    try {
      for (let i = 0; i < downloads.length; i += 1) {
        const { url, path } = downloads[i];
        const dir = path.substring(0, path.lastIndexOf("/"));
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        try {
          await FileSystem.downloadAsync(url, path);
        } catch {
          // ignore individual tile failures
        }
        setProgress(i + 1);
      }
      Alert.alert("Download complete", `Stored ${downloads.length} tiles for offline use.`);
    } catch (e) {
      Alert.alert("Download failed", "An error occurred while downloading tiles.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>OFFLINE CHART DOWNLOAD</Text>
          <Text style={styles.sub}>
            Define a bounding box and zoom range to cache OpenStreetMap tiles locally for offline use.
          </Text>

          <Text style={styles.label}>North latitude</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={north}
            onChangeText={setNorth}
          />

          <Text style={styles.label}>South latitude</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={south}
            onChangeText={setSouth}
          />

          <Text style={styles.label}>West longitude</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={west}
            onChangeText={setWest}
          />

          <Text style={styles.label}>East longitude</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={east}
            onChangeText={setEast}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Min zoom</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={minZoom}
                onChangeText={setMinZoom}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Max zoom</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={maxZoom}
                onChangeText={setMaxZoom}
              />
            </View>
          </View>

          {isDownloading && (
            <View style={styles.progressBox}>
              <ActivityIndicator color={GARMIN_ACCENT} />
              <Text style={styles.progressText}>
                Downloading tiles {progress} / {total}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isDownloading && { opacity: 0.6 }]}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            <Text style={styles.buttonText}>{isDownloading ? "Downloading…" : "Start download"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GARMIN_BG,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  heading: {
    color: GARMIN_ACCENT,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sub: {
    color: GARMIN_TEXT,
    fontSize: 13,
    marginBottom: 16,
  },
  label: {
    color: GARMIN_TEXT,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: GARMIN_TEXT,
  },
  row: {
    flexDirection: "row",
    marginTop: 8,
  },
  button: {
    marginTop: 24,
    backgroundColor: GARMIN_ACCENT,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#020617",
    fontWeight: "600",
  },
  progressBox: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  progressText: {
    color: GARMIN_TEXT,
    marginLeft: 8,
  },
});
