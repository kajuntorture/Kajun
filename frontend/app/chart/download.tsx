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
import { useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";

const GARMIN_BG = "#020617";
const GARMIN_ACCENT = "#22d3ee";
const GARMIN_TEXT = "#e5e7eb";

const TILE_BASE_URL = "https://a.tile.openstreetmap.org";
const MAX_TILES_PER_BATCH = 2000; // safety limit to avoid huge downloads

function buildTileUrl(z: number, x: number, y: number) {
  return `${TILE_BASE_URL}/${z}/${x}/${y}.png`;
}

function deg2tile(lat: number, lon: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = 2 ** zoom;
  const xtile = Math.floor(((lon + 180) / 360) * n);
  const ytile = Math.floor(
    (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n
  );
  return { x: xtile, y: ytile };
}

export default function ChartDownloadScreen() {
  const params = useLocalSearchParams<{ lat?: string; lon?: string }>();
  const centerLat = params.lat ? parseFloat(params.lat) : 37.75;
  const centerLon = params.lon ? parseFloat(params.lon) : -122.45;

  const initialNorth = (centerLat + 0.2).toFixed(4);
  const initialSouth = (centerLat - 0.2).toFixed(4);
  const initialWest = (centerLon - 0.3).toFixed(4);
  const initialEast = (centerLon + 0.3).toFixed(4);

  const [north, setNorth] = useState(initialNorth);
  const [south, setSouth] = useState(initialSouth);
  const [east, setEast] = useState(initialEast);
  const [west, setWest] = useState(initialWest);
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

    if (downloads.length > MAX_TILES_PER_BATCH) {
      Alert.alert(
        "Area too large",
        `This selection would download ${downloads.length} tiles. Please reduce the area or zoom range (try zoom 10–12).`
      );
      return;
    }

    setTotal(downloads.length);
    setProgress(0);
    setIsDownloading(true);

    try {
      for (let i = 0; i < downloads.length; i += 1) {
        const { url, path } = downloads[i];
        const dir = path.substring(0, path.lastIndexOf("/"));
        try {
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        } catch (mkdirErr) {
          // eslint-disable-next-line no-console
          console.log("Failed to create directory", dir, mkdirErr);
        }
        try {
          await FileSystem.downloadAsync(url, path);
        } catch (downloadErr) {
          // eslint-disable-next-line no-console
          console.log("Tile download failed", url, downloadErr);
        }
        setProgress(i + 1);
      }
      Alert.alert("Download complete", `Stored ${downloads.length} tiles for offline use.`);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.log("Download error", e);
      Alert.alert(
        "Download failed",
        e?.message ? `Error: ${String(e.message)}` : "An error occurred while downloading tiles."
      );
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
            The bounding box is pre-filled around your current location when available. Adjust as needed
            and start the download.
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
