import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

const GARMIN_BG = "#020617"; // near-black navy
const GARMIN_PANEL = "#020617";
const GARMIN_ACCENT = "#22d3ee"; // cyan
const GARMIN_TEXT = "#e5e7eb"; // light gray

export default function ChartScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(true);

  useEffect(() => {
    (async () => {
      setRequesting(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location permission denied. Enable GPS to use the chart.");
        setRequesting(false);
        return;
      }

      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        setLocation(last as any);
      }

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (loc) => {
          setLocation(loc as any);
        }
      );
      setRequesting(false);
    })();
  }, []);

  const region = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      };

  // Lazy-load react-native-maps only on native to avoid web compatibility issues
  let MapViewComp: any = null;
  let MarkerComp: any = null;
  let UrlTileComp: any = null;
  let PROVIDER_GOOGLE_CONST: any = null;

  if (Platform.OS !== "web") {
    const Maps = require("react-native-maps");
    MapViewComp = Maps.default;
    MarkerComp = Maps.Marker;
    UrlTileComp = Maps.UrlTile;
    PROVIDER_GOOGLE_CONST = Maps.PROVIDER_GOOGLE;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topPanel}>
          <Text style={styles.heading}>CHART</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>SOG</Text>
            <Text style={styles.infoValue}>
              {location ? (location.coords.speed ? (location.coords.speed * 1.94384).toFixed(1) : "0.0") : "--"} kn
            </Text>
            <Text style={[styles.infoLabel, { marginLeft: 24 }]}>COG</Text>
            <Text style={styles.infoValue}>
              {location && typeof location.coords.heading === "number" && location.coords.heading >= 0
                ? location.coords.heading.toFixed(0)
                : "--"}
              °
            </Text>
          </View>
        </View>

        <View style={styles.mapWrapper}>
          {!location && requesting && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={GARMIN_ACCENT} />
              <Text style={styles.loadingText}>Acquiring GPS fix…</Text>
            </View>
          )}

          {Platform.OS === "web" ? (
            <View style={[StyleSheet.absoluteFill, styles.webPlaceholder]}>
              <Text style={styles.webPlaceholderTitle}>Chart preview not available on web</Text>
              <Text style={styles.webPlaceholderText}>
                Open this project in Expo Go or a native build to see the live Garmin-style chart with GPS.
              </Text>
            </View>
          ) : MapViewComp ? (
            <MapViewComp
              style={StyleSheet.absoluteFill}
              provider={PROVIDER_GOOGLE_CONST}
              initialRegion={region}
              region={region}
              customMapStyle={garminDarkMapStyle}
              showsCompass={false}
              showsScale={false}
              rotateEnabled
              pitchEnabled={false}
              toolbarEnabled={false}
            >
              {/* OSM base tiles */}
              {UrlTileComp && (
                <UrlTileComp
                  urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maximumZ={19}
                  flipY={false}
                  tileSize={256}
                  zIndex={-1}
                />
              )}

              {location && MarkerComp && (
                <MarkerComp
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={styles.vesselMarkerOuter}>
                    <View style={styles.vesselMarkerInner} />
                  </View>
                </MarkerComp>
              )}
            </MapViewComp>
          ) : null}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Start Track</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Add WPT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Center</Text>
          </TouchableOpacity>
        </View>

        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
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
    backgroundColor: GARMIN_BG,
  },
  topPanel: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: GARMIN_PANEL,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1f2933",
  },
  heading: {
    color: GARMIN_ACCENT,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  infoLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  infoValue: {
    color: GARMIN_TEXT,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  mapWrapper: {
    flex: 1,
    backgroundColor: "#020617",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    backgroundColor: "rgba(2,6,23,0.8)",
  },
  loadingText: {
    marginTop: 8,
    color: GARMIN_TEXT,
  },
  vesselMarkerOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: GARMIN_ACCENT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.9)",
  },
  vesselMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GARMIN_ACCENT,
  },
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: GARMIN_PANEL,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#1f2933",
    justifyContent: "space-between",
  },
  primaryButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: GARMIN_ACCENT,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#020617",
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4b5563",
  },
  secondaryButtonText: {
    color: GARMIN_TEXT,
    fontWeight: "500",
  },
  errorBanner: {
    position: "absolute",
    bottom: 70,
    left: 16,
    right: 16,
    backgroundColor: "#7f1d1d",
    borderRadius: 8,
    padding: 8,
  },
  errorText: {
    color: "#fee2e2",
    fontSize: 12,
    textAlign: "center",
  },
  webPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#020617",
  },
  webPlaceholderTitle: {
    color: GARMIN_ACCENT,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  webPlaceholderText: {
    color: GARMIN_TEXT,
    fontSize: 13,
    textAlign: "center",
  },
});

const garminDarkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#020617" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#020617" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#020617" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry.fill",
    stylers: [{ color: "#020617" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ visibility: "off" }],
  },
];
