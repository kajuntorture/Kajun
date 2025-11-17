import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/api/client";
import { useTrackStore } from "../../src/store/useTrackStore";
import { useRouter } from "expo-router";

const GARMIN_BG = "#020617"; // near-black navy
const GARMIN_PANEL = "#020617";
const GARMIN_ACCENT = "#22d3ee"; // cyan
const GARMIN_TEXT = "#e5e7eb"; // light gray

const TILE_ROOT = `${FileSystem.documentDirectory}tiles`;

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export default function ChartScreenNative() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(true);
  const [isOfflinePreferred, setIsOfflinePreferred] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const router = useRouter();

  const { currentTrackId, isTracking, startTrack, stopTrack, addPoint, points, reset } =
    useTrackStore();

  const {
    data: waypointData,
    isLoading: loadingWpts,
  } = useQuery<Waypoint[], Error>({
    queryKey: ["chart-waypoints"],
    enabled: showWaypoints,
    queryFn: async () => {
      const res = await api.get<Waypoint[]>("/api/waypoints");
      return res.data;
    },
  });

  const waypoints = showWaypoints && waypointData ? waypointData : [];

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
        async (loc) => {
          setLocation(loc as any);

          if (isTracking && currentTrackId) {
            const point = {
              timestamp: new Date().toISOString(),
              lat: loc.coords.latitude,
              lon: loc.coords.longitude,
              speed_kn: loc.coords.speed ? loc.coords.speed * 1.94384 : undefined,
              course_deg:
                typeof loc.coords.heading === "number" && loc.coords.heading >= 0
                  ? loc.coords.heading
                  : undefined,
            };
            addPoint(point);

            // Send in small batches of up to 10 points
            if (points.length >= 9) {
              try {
                await api.post(`/api/tracks/${currentTrackId}/points`, {
                  points: [...points, point],
                });
                reset();
                startTrack(currentTrackId);
              } catch (e) {
                // eslint-disable-next-line no-console
                console.log("Failed to push track points", e);
              }
            }
          }
        }
      );
      setRequesting(false);
    })();
  }, [currentTrackId, isTracking, points, addPoint, reset, startTrack]);

  const handleToggleTrack = async () => {
    if (!isTracking) {
      // Start new track via backend
      try {
        const res = await api.post("/api/tracks", {
          name: "On-water track",
        });
        const trackId = res.data.id;
        startTrack(trackId);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Failed to start track", e);
      }
    } else if (currentTrackId) {
      // Stop track
      try {
        await api.patch(`/api/tracks/${currentTrackId}/end`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log("Failed to end track", e);
      }
      stopTrack();
    }
  };

  const handleAddWaypoint = async () => {
    if (!location) {
      Alert.alert("No position", "Waiting for a GPS position before creating a waypoint.");
      return;
    }
    try {
      const now = new Date();
      const label = `WPT ${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      await api.post("/api/waypoints", {
        name: label,
        lat: location.coords.latitude,
        lon: location.coords.longitude,
      });
      Alert.alert("Waypoint saved", `${label} stored.`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Failed to create waypoint", e);
      Alert.alert("Error", "Could not save waypoint.");
    }
  };

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

  const useOfflineTiles = isOfflinePreferred;

  const offlineUrlTemplate = `${TILE_ROOT}/{z}/{x}/{y}.png`;
  const onlineUrlTemplate = "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png";

  // Dynamically require react-native-maps so we can gracefully handle native incompatibility
  let MapViewComp: any = null;
  let MarkerComp: any = null;
  let UrlTileComp: any = null;
  let PROVIDER_GOOGLE_CONST: any = null;

  if (Platform.OS === "ios" || Platform.OS === "android") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Maps = require("react-native-maps");
      MapViewComp = Maps.default;
      MarkerComp = Maps.Marker;
      UrlTileComp = Maps.UrlTile;
      PROVIDER_GOOGLE_CONST = Maps.PROVIDER_GOOGLE;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("react-native-maps not available", e);
      if (!mapError) {
        setMapError("Map module not available in this build.");
      }
    }
  }

  const downloadHref = location
    ? `/chart/download?lat=${location.coords.latitude}&lon=${location.coords.longitude}`
    : "/chart/download";

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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tiles</Text>
            <Text style={styles.infoValue}>{useOfflineTiles ? "Offline" : "Online"}</Text>
            <Text style={[styles.infoLabel, { marginLeft: 24 }]}>WPT</Text>
            <Text
              style={[styles.infoValue, { textDecorationLine: "underline" }]}
              onPress={() => setShowWaypoints((prev) => !prev)}
            >
              {showWaypoints ? "On" : "Off"}
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

          {!MapViewComp || !UrlTileComp || !MarkerComp || !PROVIDER_GOOGLE_CONST ? (
            <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
              <Text style={styles.loadingText}>
                {mapError ?? "Map module not available in this Expo Go build. Chart data (SOG/COG, waypoints) still works."}
              </Text>
            </View>
          ) : (
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
              <UrlTileComp
                urlTemplate={useOfflineTiles ? offlineUrlTemplate : onlineUrlTemplate}
                maximumZ={19}
                flipY={false}
                tileSize={256}
                zIndex={-1}
                shouldReplaceMapContent={false}
              />

              {location && (
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

              {showWaypoints && !loadingWpts &&
                waypoints.map((w) => (
                  <MarkerComp
                    key={w.id}
                    coordinate={{ latitude: w.lat, longitude: w.lon }}
                    anchor={{ x: 0.5, y: 1 }}
                  >
                    <View style={styles.wptMarker}>
                      <Text style={styles.wptText}>{w.name}</Text>
                    </View>
                  </MarkerComp>
                ))}
            </MapViewComp>
          )}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleToggleTrack}>
            <Text style={styles.primaryButtonText}>{isTracking ? "Stop Track" : "Start Track"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setIsOfflinePreferred((prev) => !prev)}
          >
            <Text style={styles.secondaryButtonText}>
              {useOfflineTiles ? "Use Online" : "Use Offline"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleAddWaypoint}>
            <Text style={styles.secondaryButtonText}>Add WPT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push(downloadHref)}
          >
            <Text style={styles.secondaryButtonText}>Download</Text>
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
    marginTop: 4,
  },
  infoLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },
  infoValue: {
    color: GARMIN_TEXT,
    fontSize: 14,
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
    textAlign: "center",
    paddingHorizontal: 24,
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
  wptMarker: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "#22d3ee",
  },
  wptText: {
    color: "#e5e7eb",
    fontSize: 10,
  },
  bottomBar: {
    flexDirection: "row",
    paddingHorizontal: 8,
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
    paddingHorizontal: 8,
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
